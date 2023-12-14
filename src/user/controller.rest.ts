import { Controller, Query, Body, Get, Post, Patch } from "@nestjs/common";

import { PondLog, PATH_POND_LOG, getPondLogDto, getPondLogRes, postPondLogDto, postPondLogRes } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto } from "qqlx-cdk";
import { getLocalNetworkIPs } from "qqlx-sdk";

import { PondLogDao } from "./dao";

@Controller(PATH_POND_LOG)
export class PondLogController {
    constructor(private readonly PondLogDao: PondLogDao) {}

    @Post("/get")
    @ToResponse()
    async get(@Body() request: getPondLogDto<PondLog>) {
        // const { page } = request
        const page = getPageDto<PondLog>();
        const results = await this.PondLogDao.page(page);

        return results;
    }

    @Patch()
    @ToResponse()
    async patch(@Body() body: postPondLogDto): Promise<postPondLogRes> {
        console.log(body.schema);
        await this.PondLogDao.insertOne(body.schema);
        return null;
    }
}
