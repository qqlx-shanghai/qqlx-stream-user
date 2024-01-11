import { Controller, Query, Body, Get, Post, Patch } from "@nestjs/common";
import { EventPattern, MessagePattern } from "@nestjs/microservices";

import { StreamLog, PATH_STREAM_USER, getStreamUserDto, getStreamUserRes, UserInfo, Response, _Owner } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto, getResponseData } from "qqlx-cdk";
import { getLocalNetworkIPs, DropletHostRpc } from "qqlx-sdk";
import { StreamUserService } from "src/rest/user.service";

@Controller()
export default class {
    constructor(
        //
        private readonly StreamUserService: StreamUserService) {
    }

    @MessagePattern(`${PATH_STREAM_USER}/get`)
    @ToResponse()
    async getUser (dto: { Authorization: string }): Promise<_Owner> {
        return this.StreamUserService.getUserByAuthorization(dto.Authorization)
    }

    @MessagePattern(`${PATH_STREAM_USER}/info/get`)
    @ToResponse()
    async getUserInfo (dto: { Authorization: string }): Promise<getStreamUserRes> {
        return this.StreamUserService.getUserInfoByAuthorization(dto.Authorization)
    }
}
