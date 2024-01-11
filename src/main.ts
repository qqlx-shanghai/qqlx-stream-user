import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { } from "qqlx-core";
import { toNumber, toString, toBoolean } from "qqlx-cdk";
import { getLocalNetworkIPs, CommonExceptionFilter, ResponseInterceptor, DropletHostRpc, StreamLogRpc } from "qqlx-sdk";

import { TCP_PORT, TcpModule } from "./tcp/module";
import { REST_PORT, RestModule } from "./rest/module";

async function bootstrap () {
    // 对内的微服务
    const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(TcpModule, {
        transport: Transport.TCP,
        options: { host: "0.0.0.0", port: TCP_PORT },
    });
    await microservice.listen();

    // 对外的 RESTful API
    const app = await NestFactory.create(RestModule);
    app.useGlobalFilters(new CommonExceptionFilter(new StreamLogRpc(new DropletHostRpc())))
    app.useGlobalInterceptors(new ResponseInterceptor(new StreamLogRpc(new DropletHostRpc())))
    await app.listen(REST_PORT);

    // System tips
    console.log("\n---- ---- ---- main.ts @qqlx-droplet-host");
    const ips = getLocalNetworkIPs();
    for (const ip of ips) console.log(`${Object.values(ip).reverse().join(".")}`);
    console.log(`---- ---- ---- success on @tcp:${TCP_PORT} @http:${REST_PORT}`);
}
bootstrap();
