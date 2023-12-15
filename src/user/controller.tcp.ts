import { Controller, Query, Body, Get, Post, Patch } from "@nestjs/common";
import { EventPattern, MessagePattern } from "@nestjs/microservices";

import { PondLog, PATH_POND_LOG, getPondLogDto, getPondLogRes, postPondLogDto, postPondLogRes } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto } from "qqlx-cdk";
import { getLocalNetworkIPs, DropletLocationMessenger } from "qqlx-sdk";

import { PondLogDao } from "./dao";
import { PondLogService } from "./service";

@Controller()
export default class {
    constructor(private readonly DropletLocationMessenger: DropletLocationMessenger, private readonly PondLogService: PondLogService) {}

    @MessagePattern(`${PATH_POND_LOG}/patch`)
    @ToResponse()
    async patch(@Body() dto: postPondLogDto): Promise<postPondLogRes> {
        return this.PondLogService.patch(dto);
    }
}
