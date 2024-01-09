import { Controller, Query, Body, Get, Post, Patch, UseGuards } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer"

import { StreamUser, PATH_STREAM_USER_EMAIL, getStreamUserEmailCodeDto, postStreamUserEmailDto, postStreamUserEmailRes } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto, getConditionMatchStr, UserEmailSchema } from "qqlx-cdk";
import { DropletHostRpc, getLocalNetworkIPs, getRandomString, StreamLogRpc, UserGuard } from "qqlx-sdk";

import { UserEmailDao, UserWeChatDao } from "./user.dao";
import { StreamUserService } from "./user.service";

type EmailOption = {
    /** 发件人邮箱 */
    from?: string,
    /** 收件人邮箱，可以是多个，用逗号分隔 */
    to: string,
    /** 邮件主题 */
    subject: string,
    /** 邮件正文，纯文本格式 */
    text: string
}

@Controller(PATH_STREAM_USER_EMAIL)
export default class {

    /** 官方地址 */
    emailOfficial!: string
    /** 发送器 */
    emailTransport!: Transporter
    /** 五分钟有效时间 */
    emailVerifyTimes = 5 * 60 * 1000

    /** 邮箱 = 验证码:创建时间 */
    emailVerifyMap = new Map<string, string>()
    /** 验证码 = 邮箱:创建时间 */
    codeVerifyMap = new Map<string, string>()

    constructor(
        //
        private readonly DropletHostRpc: DropletHostRpc,
        private readonly StreamLogRpc: StreamLogRpc,
        private readonly StreamUserService: StreamUserService,
        private readonly UserEmailDao: UserEmailDao,

    ) { }

    /** 邮箱登录 */
    @Post()
    async post (@Body() dto: postStreamUserEmailDto): Promise<postStreamUserEmailRes> {
        const code = toString(dto.code).toUpperCase()

        // 验证码是否已经过期
        const exist = this.codeVerifyMap.get(code)
        if (!exist) throw new Error(`请输入正确的验证码: ${code}`)

        const now = Date.now()
        const email = toString(exist.split(':')[0])
        const timeExpire = toNumber(exist.split(':')[1]) + this.emailVerifyTimes
        if (now >= timeExpire) throw new Error(`验证码已经过期: ${email}`)

        const user = await this.StreamUserService.getUserByEmail(email)
        const result = { authorization: "" }

        // 已经注册过了
        if (user) {
            result.authorization = await this.StreamUserService.putAuthorization(user, now + 86400000 * 5)
        }
        // 没有注册过
        else {
            const user = await this.StreamUserService.post()
            result.authorization = await this.StreamUserService.putAuthorization(user, now + 86400000 * 5)

            // 新增用户的邮箱信息
            const schema = new UserEmailSchema()
            schema.email = email
            schema.uuid32 = user.uuid32
            await this.UserEmailDao.insertOne(schema)
        }

        return result
    }

    @Get(`/code`)
    async get (@Query() dto: getStreamUserEmailCodeDto) {
        const email = toString(dto.email)
        const match = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
        if (!match) throw new Error(`请输入正确的邮箱：${email}`)

        // 是否已经注册过了
        // const user = await this.StreamUserService.getUserByEmail(email)
        // if (user) throw new Error(`邮箱已经注册: ${email}`)

        // 是否已经发送过邮件（一分钟一封）
        const exist = this.emailVerifyMap.get(email)
        if (exist) {
            const timeExpire = toNumber(exist.split(':')[1]) + 1000 * 60
            if (Date.now() <= timeExpire) {
                throw new Error(`请在 ${new Date(timeExpire).toLocaleString()} 之后发送验证码`)
            }
        }

        // 发送邮件
        const code = getRandomString().toUpperCase()
        await this.postEmail({
            to: email,
            subject: "Verify Code",
            text: `Your email code to login is: ${code}`
        })

        // 缓存
        const now = Date.now()
        this.emailVerifyMap.set(email, `${code}:${now}`)
        this.codeVerifyMap.set(code, `${email}:${now}`)
    }

    private async postEmail (option: EmailOption) {
        if (!this.emailTransport) await this.initialEmailTransporter()

        option.from = this.emailOfficial
        return new Promise((resolve, reject) => {
            this.emailTransport.sendMail(option, (error, info) => {
                if (error) reject(error)
                else resolve(info)
            });
        })
    }

    private async initialEmailTransporter () {
        const official_mail = await this.DropletHostRpc.get({ key: `official_mail` })
        this.emailOfficial = official_mail.remark

        const official_mail_authorization_code = await this.DropletHostRpc.get({ key: `official_mail_authorization_code` })

        // IMAP （Internet Message Access Protocol）协议用于支持使用电子邮件客户端交互式存取服务器上的邮件。
        const official_mail_imtp = await this.DropletHostRpc.get({ key: `official_mail_imtp` })

        // SMTP （Simple Mail Transfer Protocol）协议用于支持使用电子邮件客户端发送电子邮件
        const official_mail_smtp = await this.DropletHostRpc.get({ key: `official_mail_smtp` })

        this.emailTransport = createTransport({
            host: 'smtp.qq.com',
            port: 465,
            secure: true,
            auth: {
                user: official_mail_smtp.remark, // 邮箱账号
                pass: official_mail_authorization_code.remark // 邮箱授权码
            }
        })
    }
}
