import { utilities as nestWinstonModuleUtilitiee } from "nest-winston";
import * as winston from "winston";

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilitiee.format.nestLike("TaskManager")
      ),
    }),
    new winston.transports.File({
      filename: "application.log",
      level: "info",

      format: winston.format.combine(
        winston.format.label({ label: "TaskManager" }),
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: "error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.label({ label: "TaskManager" }),

        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
};
