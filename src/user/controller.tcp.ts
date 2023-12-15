import { Controller, Query, Body, Get, Post, Patch } from "@nestjs/common";
import { EventPattern, MessagePattern } from "@nestjs/microservices";
import axios from "axios";
import type { AxiosInstance } from "axios";

import { PondLog, PATH_USER, getUserDto, getUserRes, UserInfo, Response } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto, getResponseData } from "qqlx-cdk";
import { getLocalNetworkIPs, DropletLocationMessenger } from "qqlx-sdk";

// import { PondLogDao } from "./dao";
// import { PondLogService } from "./service";

@Controller()
export default class {
    request!: AxiosInstance;
    constructor(
        //
        private readonly DropletLocationMessenger: DropletLocationMessenger
    ) // private readonly PondLogService: PondLogService
    {
        this.request = axios.create({
            baseURL: "https://qqlx.tech",
            timeout: 5000,
        });
        this.request.interceptors.response.use(
            (res) => res.data,
            (error) => Promise.reject(error)
        );
    }

    @MessagePattern(`${PATH_USER}/get`)
    @ToResponse()
    async getUserInfo(dto: getUserDto): Promise<getUserRes> {
        // <UserInfo>
        const res: Response<{ userId: string }> = await this.request.post("/qqlx/user/wechat/get", {}, { headers: { Authorization: dto.Authorization } });
        const data = getResponseData(res);
        return { uid: data.userId };
    }
}
