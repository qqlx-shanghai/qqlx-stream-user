import { Controller, Query, Body, Get, Post, Patch, UseGuards, Headers, Put, Req } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer"

import { StreamUser, getStreamUserDto, getStreamUserRes, putStreamUserDto, putStreamUserRes, PATH_STREAM_USER } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto, getConditionMatchStr, UserEmailSchema } from "qqlx-cdk";
import { DropletHostRpc, getLocalNetworkIPs, getRandomString, StreamLogRpc, UserGuard } from "qqlx-sdk";

import { UserEmailDao, UserWeChatDao } from "./user.dao";
import { StreamUserService } from "./user.service";

@Controller(PATH_STREAM_USER)
export class UserController {

    constructor(
        private readonly StreamUserService: StreamUserService
    ) { }

    @Get()
    async get (@Headers('Authorization') authorization: string): Promise<getStreamUserRes> {
        return this.StreamUserService.getUserInfo(authorization)
    }

    @Put()
    async put (@Headers('Authorization') authorization: string, @Body('dto') dto: putStreamUserDto): Promise<putStreamUserRes> {
        const owner = await this.StreamUserService.getOwner(authorization)
        const jwt_token = await this.StreamUserService.putAuthorization(owner, dto.timeExpire)
        return { authorization: jwt_token }
    }
}
