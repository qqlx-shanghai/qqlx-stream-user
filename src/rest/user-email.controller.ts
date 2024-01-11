import { Controller, Query, Body, Get, Post, Patch, UseGuards } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer";

import { StreamUser, PATH_STREAM_USER_EMAIL, patchStreamUserEmailCodeDto, postStreamUserEmailDto, postStreamUserEmailRes, ENUM_STREAM_LOG } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto, getConditionMatchStr, UserEmailSchema } from "qqlx-cdk";
import { DropletHostRpc, getLocalNetworkIPs, getRandomString, StreamLogRpc, UserGuard } from "qqlx-sdk";

import { UserEmailDao, UserWeChatDao } from "./user.dao";
import { StreamUserService } from "./user.service";

type EmailOption = {
    /** 发件人邮箱 */
    from?: string;
    /** 收件人邮箱，可以是多个，用逗号分隔 */
    to: string;
    /** 邮件主题 */
    subject: string;
    /** 邮件正文，纯文本格式 */
    text: string;
};

@Controller(PATH_STREAM_USER_EMAIL)
export default class {

    constructor(
        private readonly DropletHostRpc: DropletHostRpc,
        private readonly StreamLogRpc: StreamLogRpc,
        private readonly StreamUserService: StreamUserService,
        private readonly UserEmailDao: UserEmailDao
    ) { }

    @Post()
    async login (@Body() dto: postStreamUserEmailDto): Promise<postStreamUserEmailRes> {
        const code = toString(dto.code).toUpperCase();

        // 验证码是否已经过期
        const exist = this.codeVerifyMap.get(code);
        if (!exist) throw new Error(`无效的验证码: ${code}`);

        const now = Date.now();
        const timeExpire = toNumber(exist.split(":")[1]) + this.codeVerifyMaxTime;
        if (now >= timeExpire) throw new Error(`验证码已经过期: ${code}`);

        const email = toString(exist.split(":")[0]);
        const user = await this.StreamUserService.getUserByEmail(email);
        const result = { authorization: "" };

        // 已经注册过了
        if (user) {
            result.authorization = await this.StreamUserService.putAuthorization(user, now + 86400000 * 5);
        }
        // 没有注册过
        else {
            const user = await this.StreamUserService.post();
            result.authorization = await this.StreamUserService.putAuthorization(user, now + 86400000 * 5);

            // 新增用户的邮箱信息
            const schema = new UserEmailSchema();
            schema.email = email;
            schema.uuid32 = user.uuid32;
            await this.UserEmailDao.insertOne(schema);
        }

        return result;
    }

    // ========================================================================================
    // ========================================================================================
    // ========================================================================================
    // ========================================================================================
    // ========================================================================================
    // ========================================================================================

    /** 邮箱 => 验证码:创建时间 */
    private codePatchedMap = new Map<string, string>();
    private codePatchMaxTime = 1000 * 60

    /** 验证码 => 邮箱:创建时间 */
    private codeVerifyMap = new Map<string, string>();
    private codeVerifyMaxTime = 1000 * 60 * 5

    @Get(`/code`)
    async patch (@Query() dto: patchStreamUserEmailCodeDto) {

        // 1
        const email = toString(dto.email);
        const match = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
        if (!match) throw new Error(`请输入正确的邮箱：${email}`);

        // 2.同一个邮箱，一分钟内是否已经发送过验证码
        const now = Date.now();
        const exist = this.codePatchedMap.get(email);
        if (exist) {
            const timeExpire = toNumber(exist.split(":")[1]) + this.codePatchMaxTime
            if (now <= timeExpire) {
                throw new Error(`请在 ${new Date(timeExpire).toLocaleString()} 之后发送验证码`);
            }
        }

        // 3.通过邮件发送验证码，并缓存
        const code = getRandomString().toUpperCase();
        await this.postEmail({ to: email, subject: "Verify Code", text: `${code}` });
        this.codePatchedMap.set(email, `${code}:${now}`);
        this.codeVerifyMap.set(code, `${email}:${now}`);

        this.StreamLogRpc.simplePost(ENUM_STREAM_LOG.DEBUG, 'email code', code)
    }

    // ========================================================================================
    // ========================================================================================
    // ========================================================================================
    // ========================================================================================
    // ========================================================================================
    // ========================================================================================

    /** 用于发信的官方邮箱 */
    private emailOfficial!: string;
    private emailTransport!: Transporter;

    private async postEmail (option: EmailOption) {
        if (!this.emailTransport) await this.initialEmailTransporter();

        option.from = this.emailOfficial;
        return new Promise((resolve, reject) => {
            this.emailTransport.sendMail(option, (error, info) => {
                if (error) reject(error);
                else resolve(info);
            });
        });
    }

    /**
     * @IMAP （Internet Message Access Protocol）协议用于支持使用电子邮件客户端交互式存取服务器上的邮件。
     * @SMTP （Simple Mail Transfer Protocol）协议用于支持使用电子邮件客户端发送电子邮件
     */
    private async initialEmailTransporter () {
        const official_mail = await this.DropletHostRpc.get({ key: `official_mail` });
        this.emailOfficial = official_mail.remark;

        const official_mail_authorization_code = await this.DropletHostRpc.get({ key: `official_mail_authorization_code` });
        const official_mail_imtp = await this.DropletHostRpc.get({ key: `official_mail_imtp` });
        const official_mail_smtp = await this.DropletHostRpc.get({ key: `official_mail_smtp` });

        this.emailTransport = createTransport({
            host: official_mail_smtp.remark,
            port: 465,
            secure: true,
            auth: {
                user: this.emailOfficial, // 发信账号
                pass: official_mail_authorization_code.remark, // 发信账号的邮箱授权码
            },
        });
    }
}
