import { Controller, Query, Body, Get, Post, Patch } from "@nestjs/common";
import { EventPattern, MessagePattern } from "@nestjs/microservices";
import axios from "axios";
import type { AxiosInstance } from "axios";

import { StreamLog, PATH_STREAM_USER, getStreamUserDto, getStreamUserRes, UserInfo, Response } from "qqlx-core";
import { toNumber, toString, ToResponse, getPageDto, getResponseData } from "qqlx-cdk";
import { getLocalNetworkIPs, DropletHostMessenger } from "qqlx-sdk";

@Controller()
export default class {
    request!: AxiosInstance;
    constructor() {
        this.request = axios.create({
            baseURL: "https://qqlx.tech",
            timeout: 5000,
        });
        this.request.interceptors.response.use(
            (res) => res.data,
            (error) => Promise.reject(error)
        );
    }

    @MessagePattern(`${PATH_STREAM_USER}/get`)
    @ToResponse()
    async getUserInfo(dto: getStreamUserDto): Promise<getStreamUserRes> {
        // <UserInfo>
        const res: Response<{ userId: string }> = await this.request.post("/qqlx/user/wechat/get", {}, { headers: { Authorization: dto.Authorization } });
        const data = getResponseData(res);
        return { uid: data.userId };
    }
}
