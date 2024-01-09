import { sign, verify } from "jsonwebtoken";
import { Injectable } from "@nestjs/common";

import { StreamUser, PATH_STREAM_LOG, getStreamUserDto, getStreamUserRes, VARCHAR50_PG, ENUM_ERROR_CODE, UserInfo, UserEmail, RELATIONS_STREAM_USER_WECHAT, RELATIONS_STREAM_USER_TELECOM, RELATIONS_STREAM_USER_EMAIL } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto, getConditionMatchStr, StreamUserSchema, getErrorTranslate, UserWeChatSchema, UserTelecomSchema, UserEmailSchema } from "qqlx-cdk";
import { DropletHostRpc, getLocalNetworkIPs, getUUID32 } from "qqlx-sdk";

import { StreamUserDao, UserEmailDao, UserTelecomDao, UserWeChatDao } from "./user.dao";

type JwtInfo = {
    uuid32: VARCHAR50_PG;
    timeExpire: number;
}

@Injectable()
export class StreamUserService {

    /** uuid32:jwt */
    private jwtMap = new Map<string, string>()
    private jwtKey!: string

    constructor(
        //
        private readonly DropletHostRpc: DropletHostRpc,
        private readonly StreamUserDao: StreamUserDao,
        private readonly UserWeChatDao: UserWeChatDao,
        private readonly UserTelecomDao: UserTelecomDao,
        private readonly UserEmailDao: UserEmailDao,
    ) {
        this.initial()
    }

    /** 获取用户信息（较耗时） */
    async getUserInfoByAuthorization (authorization: string): Promise<UserInfo> {
        const user = await this.getUserByAuthorization(authorization)
        const info = await this.getUserInfo(user.uuid32)
        if (!info) throw ENUM_ERROR_CODE.NOT_FOUND_USER

        return info
    }

    /** 快速鉴权 */
    async getUserByAuthorization (authorization: string): Promise<StreamUser> {
        const info = verify(authorization, this.jwtKey) as JwtInfo;

        // 不能过期
        const timeExpire = toNumber(info.timeExpire)
        if (Date.now() >= timeExpire) throw ENUM_ERROR_CODE.AUTHORIZED_BELOW

        // 要有效
        const user = await this.getUser(info.uuid32)
        if (!user) throw ENUM_ERROR_CODE.NOT_FOUND_USER

        // 存在抢登的情况
        const jwt_token = this.jwtMap.get(info.uuid32)
        if (jwt_token && jwt_token !== authorization) throw ENUM_ERROR_CODE.AUTHORIZED_REPEAT

        return user
    }

    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================

    /** 保证 user 具有一个登录令牌 */
    async putAuthorization (user: StreamUser, timeExpire: number) {
        const jwt_token = sign({ uuid32: user.uuid32, timeExpire }, this.jwtKey)
        this.jwtMap.set(user.uuid32, jwt_token)
        if (Date.now() >= timeExpire) throw new Error(`请勿选择 ${new Date(timeExpire).toLocaleString()}`)

        return jwt_token
    }

    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================

    async getUserByEmail (email: string): Promise<StreamUser | null> {
        const qb = await this.UserEmailDao.getQueryBuilder()
        const match = await qb.where(`${this.UserEmailDao.relations_name}.email = :email`, { email })
            .getOne();

        return this.getUser(match?.uuid32)
    }

    /** 新增用户 */
    async post (): Promise<StreamUser> {
        const schema = new StreamUserSchema()
        schema.uuid32 = getUUID32()
        const user = await this.StreamUserDao.insertOne(schema);
        return user
    }

    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================

    private async getUser (uuid32?: string): Promise<StreamUser | null> {
        if (!uuid32) return null

        const qb = this.StreamUserDao.getQueryBuilder()
            .where(`${this.StreamUserDao.relations_name}.uuid32 = :uuid32`, { uuid32 })

        const match = await qb.getOne();
        return match || null
    }

    private async getUserInfo (uuid32: string): Promise<UserInfo | null> {
        const qb = this.StreamUserDao.getQueryBuilder()
        qb
            .leftJoinAndSelect(`${this.StreamUserDao.relations_name}.joinWeChatList`, `joinWeChatList`)
            .leftJoinAndSelect(`${this.StreamUserDao.relations_name}.joinTelecomList`, `joinTelecomList`)
            .leftJoinAndSelect(`${this.StreamUserDao.relations_name}.joinEmailList`, `joinEmailList`)
        // .where(`${this.StreamUserDao.relations_name}.uuid32 = :uuid32`, { uuid32 })
        // console.log(qb.getSql())

        const match = await qb.getOne();
        return match || null
    }

    private async initial () {
        const jwt_private = await this.DropletHostRpc.get({ key: 'jwt_private' })
        this.jwtKey = jwt_private.remark
    }
}
