import { Module, Injectable } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PondDroplet, SHANGHAI_POSTGRESQL_DROPLET, POND_LOG_DROPLET } from "qqlx-core";
import { PondLogSchema } from "qqlx-cdk";
import { getLocalNetworkIPs, PondDropletMessenger } from "qqlx-sdk";

import { DropletModule } from "./droplet/module";
import { PondLogController } from "./user/controller.rest";
import { PondLogDao } from "./user/dao";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [DropletModule],
            useFactory: async (pondDropletMessenger: PondDropletMessenger) => {
                // 1.建立数据库链接
                const node_db = await pondDropletMessenger.get({ name: SHANGHAI_POSTGRESQL_DROPLET });
                const username = node_db.droplet?.text?.split(";")[0];
                const passwd = node_db.droplet?.text?.split(";")[1];
                console.log(`1.从 pond-droplet 成功取得数据库`);

                // 2.推送服务信息
                const ips = getLocalNetworkIPs();
                const droplet: PondDroplet = {
                    name: POND_LOG_DROPLET,
                    lan_ip: ips[0].ip,
                    port: 1002,
                };
                await pondDropletMessenger.patch({ name: POND_LOG_DROPLET, droplet });
                console.log(`2.共享 pond-log 成功`);

                return {
                    type: "postgres",
                    host: node_db.droplet?.lan_ip,
                    port: node_db.droplet?.port,
                    username: username,
                    password: passwd,
                    database: node_db.droplet?.name,
                    logging: false,
                    entities: [PondLogSchema],
                };
            },
            inject: [PondDropletMessenger],
        }),
        TypeOrmModule.forFeature([PondLogSchema]),
    ],
    controllers: [PondLogController],
    providers: [PondLogDao],
})
export class AppModule {}
