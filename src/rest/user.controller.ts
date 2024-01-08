import { Controller, Query, Body, Get, Post, Patch, UseGuards, Headers, Put } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer"

import { StreamUser, PATH_STREAM_USER_EMAIL, getStreamUserDto, getStreamUserRes, putStreamUserDto, putStreamUserRes } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto, getConditionMatchStr, UserEmailSchema } from "qqlx-cdk";
import { DropletHostRpc, getLocalNetworkIPs, getRandomString, StreamLogRpc, UserGuard } from "qqlx-sdk";

import { UserEmailDao, UserWeChatDao } from "./user.dao";
import { StreamUserService } from "./user.service";

@Controller(PATH_STREAM_USER_EMAIL)
export default class {

    constructor(
        private readonly StreamUserService: StreamUserService
    ) { }

    @Get()
    async get (@Headers('Authorization') authorization: string): Promise<getStreamUserRes> {
        return this.StreamUserService.getUserInfoByAuthorization(authorization)
    }

    @Put()
    async put (@Headers('Authorization') authorization: string, @Body() dto: putStreamUserDto): Promise<putStreamUserRes> {
        const user = await this.StreamUserService.getUserByAuthorization(authorization)
        const jwt_token = await this.StreamUserService.putAuthorization(user, dto.timeExpire)
        return { authorization: jwt_token }
    }
}
