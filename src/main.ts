import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import {} from "qqlx-core";
import { toNumber, toString, toBoolean } from "qqlx-cdk";
import { getLocalNetworkIPs } from "qqlx-sdk";

import { TcpModule } from "./tcp.module";
import { RestModule } from "./rest.module";

async function bootstrap() {
    const TCP_PORT = 1003;
    const HTTP_PORT = 2003;

    // 对内的微服务
    const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(TcpModule, {
        transport: Transport.TCP,
        options: { host: "0.0.0.0", port: TCP_PORT },
    });
    await microservice.listen();

    // 对外的 RESTful API
    const app = await NestFactory.create(RestModule);
    await app.listen(HTTP_PORT);

    console.log("\n---- ---- ---- main.ts");
    const ips = getLocalNetworkIPs();
    console.log(
        `qqlx-pond-log:ip: ${Object.values(ips[0] || {})
            .reverse()
            .join(".")}`
    );
    console.log(`qqlx-pond-log:tcp: ${TCP_PORT}`);
    // console.log(`qqlx-pond-log:http: ${HTTP_PORT}`);
    console.log("---- ---- ---- \nrunning success!");
}
bootstrap();
