import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import {
    StreamUser,
    RELATIONS_STREAM_USER,
    UserWeChat,
    RELATIONS_STREAM_USER_WECHAT,
    UserTelecom,
    RELATIONS_STREAM_USER_TELECOM,
    UserEmail,
    RELATIONS_STREAM_USER_EMAIL,
} from "qqlx-core";
import {
    toNumber,
    toString,
    // StreamUserSchema, UserWeChatSchema, UserTelecomSchema, UserEmailSchema
} from "qqlx-cdk";
import { getLocalNetworkIPs, PgDao } from "qqlx-sdk";

import { StreamUserSchema } from "../../../qqlx-cdk/schema-production/stream-user";
import { UserWeChatSchema } from "../../../qqlx-cdk/schema-production/stream-user-wechat";
import { UserTelecomSchema } from "../../../qqlx-cdk/schema-production/stream-user-telecom";
import { UserEmailSchema } from "../../../qqlx-cdk/schema-production/stream-user-email";

@Injectable()
export class StreamUserDao extends PgDao<StreamUser> {
    constructor(
        @InjectRepository(StreamUserSchema)
        private readonly repo: Repository<StreamUserSchema>
    ) {
        super({
            repository: repo,
            relations_name: RELATIONS_STREAM_USER,
        });
    }
}

@Injectable()
export class UserWeChatDao extends PgDao<UserWeChat> {
    constructor(
        @InjectRepository(UserWeChatSchema)
        private readonly repo: Repository<UserWeChatSchema>
    ) {
        super({
            repository: repo,
            relations_name: RELATIONS_STREAM_USER_WECHAT,
        });
    }
}

@Injectable()
export class UserTelecomDao extends PgDao<UserTelecom> {
    constructor(
        @InjectRepository(UserTelecomSchema)
        private readonly repo: Repository<UserTelecomSchema>
    ) {
        super({
            repository: repo,
            relations_name: RELATIONS_STREAM_USER_TELECOM,
        });
    }
}

@Injectable()
export class UserEmailDao extends PgDao<UserEmail> {
    constructor(
        @InjectRepository(UserEmailSchema)
        private readonly repo: Repository<UserEmailSchema>
    ) {
        super({
            repository: repo,
            relations_name: RELATIONS_STREAM_USER_EMAIL,
        });
    }
}
