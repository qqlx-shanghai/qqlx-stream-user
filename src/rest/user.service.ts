import { sign, verify } from "jsonwebtoken";
import { Injectable } from "@nestjs/common";

import {
    StreamUser,
    PATH_STREAM_LOG,
    getStreamUserDto,
    getStreamUserRes,
    VARCHAR50_PG,
    ENUM_ERROR_CODE,
    UserInfo,
    UserEmail,
    RELATIONS_STREAM_USER_WECHAT,
    RELATIONS_STREAM_USER_TELECOM,
    RELATIONS_STREAM_USER_EMAIL,
    ENUM_STREAM_LOG,
    _Owner,
} from "qqlx-core";
import {
    toNumber,
    toString,
    ToResponse,
    getPageDto,
    getConditionMatchStr,
    StreamLogSchema,
    StreamUserSchema,
    getErrorTranslate,
    UserWeChatSchema,
    UserTelecomSchema,
    UserEmailSchema,
} from "qqlx-cdk";
import { DropletHostRpc, StreamLogRpc, getLocalNetworkIPs, getUUID32 } from "qqlx-sdk";

import { StreamUserDao, UserEmailDao, UserTelecomDao, UserWeChatDao } from "./user.dao";

type JwtInfo = {
    uuid32: VARCHAR50_PG;
    timeExpire: number;
};

@Injectable()
export class StreamUserService {
    /** uuid32:jwt */
    private jwtMap = new Map<string, string>();
    private jwtKey!: string;

    constructor(
        //
        private readonly DropletHostRpc: DropletHostRpc,
        private readonly StreamLogRpc: StreamLogRpc,
        private readonly StreamUserDao: StreamUserDao,
        private readonly UserWeChatDao: UserWeChatDao,
        private readonly UserTelecomDao: UserTelecomDao,
        private readonly UserEmailDao: UserEmailDao
    ) {
        this.initial();
    }

    /** 获取用户信息（较耗时） */
    async getUserInfo (authorization: string): Promise<UserInfo> {
        const user = await this.getOwner(authorization);
        const info = await this._getUserInfo(user.uuid32);
        if (!info) throw ENUM_ERROR_CODE.NOT_FOUND_USER;

        return info;
    }

    /** 快速鉴权 */
    async getOwner (authorization: string): Promise<_Owner> {
        const info = verify(authorization, this.jwtKey) as JwtInfo;

        // 不能过期
        const timeExpire = toNumber(info.timeExpire);
        if (Date.now() >= timeExpire) throw ENUM_ERROR_CODE.AUTHORIZED_BELOW;

        // 要有效
        const user = await this.getUser(info.uuid32);
        if (!user) throw ENUM_ERROR_CODE.NOT_FOUND_USER;

        // 存在抢登的情况
        // const jwt_token = this.jwtMap.get(info.uuid32);
        // if (jwt_token && jwt_token !== authorization) throw ENUM_ERROR_CODE.AUTHORIZED_REPEAT;

        return { uuid32: user.uuid32 };
    }

    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================

    /** 保证 user 具有一个登录令牌 */
    async putAuthorization (owner: _Owner, timeExpire: number) {

        const jwt_token = sign({ uuid32: owner.uuid32, timeExpire }, this.jwtKey);
        this.jwtMap.set(owner.uuid32, jwt_token);
        if (Date.now() >= timeExpire) throw new Error(`请勿选择 ${new Date(timeExpire).toLocaleString()}`);

        // async
        this.StreamLogRpc.simplePost(ENUM_STREAM_LOG.DEBUG, `${this.constructor.name}-${this.putAuthorization.name}`, owner.uuid32)
        return jwt_token;
    }

    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================

    async getUserByEmail (email: string): Promise<StreamUser | null> {
        const qb = await this.UserEmailDao.getQueryBuilder();
        const match = await qb.where(`${this.UserEmailDao.relations_name}.email = :email`, { email }).getOne();

        // async
        this.StreamLogRpc.simplePost(ENUM_STREAM_LOG.DEBUG, `${this.constructor.name}-${this.getUserByEmail.name}`, email)
        return this.getUser(match?.uuid32);
    }

    /** 新增用户 */
    async post (): Promise<StreamUser> {
        const schema = new StreamUserSchema();
        const _user = await this.StreamUserDao.insertOne(schema);
        const user = await this.getUser(_user.uuid32)

        // async
        this.StreamLogRpc.simplePost(ENUM_STREAM_LOG.DEBUG, `${this.constructor.name}-${this.post.name}`, _user.uuid32)
        return user as StreamUser;
    }

    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================
    // ===========================================================================================

    private async getUser (uuid32?: string): Promise<StreamUser | null> {
        if (!uuid32) return null;

        const qb = this.StreamUserDao.getQueryBuilder().where(`${this.StreamUserDao.relations_name}.uuid32 = :uuid32`, { uuid32 });

        const match = await qb.getOne();
        return match || null;
    }

    private async _getUserInfo (uuid32: string): Promise<UserInfo> {
        const qb = this.StreamUserDao.getQueryBuilder()
            .where(`${this.StreamUserDao.relations_name}.uuid32 = :uuid32`, { uuid32 })
            .leftJoinAndSelect(`${this.StreamUserDao.relations_name}.joinWeChatList`, `joinWeChatList`)
            .leftJoinAndSelect(`${this.StreamUserDao.relations_name}.joinTelecomList`, `joinTelecomList`)
            .leftJoinAndSelect(`${this.StreamUserDao.relations_name}.joinEmailList`, `joinEmailList`);
        const match = await qb.getOne() as UserInfo;

        // async
        this.StreamLogRpc.simplePost(ENUM_STREAM_LOG.DEBUG,
            `${this.constructor.name}-${this._getUserInfo.name}`,
            `${qb.getSql()}; ${Object.values(qb.getParameters())}`)
        return {
            uuid32: match?.uuid32 || '',
            joinWeChatList: match?.joinWeChatList,
            joinTelecomList: match?.joinTelecomList,
            joinEmailList: match?.joinEmailList,
        }
    }

    private async initial () {
        const jwt_private = await this.DropletHostRpc.get({ key: "jwt_private" });
        this.jwtKey = jwt_private.remark;
    }
}
