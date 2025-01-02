import "dotenv/config";
import "module-alias/register";
import App from "./app";
import validateEnv from "@/utils/validateEnv";
import UserController from "@/resources/user/user-controller";
import AdminController from "@/resources/admin/admin-controller";

//to be sure we have all env files
validateEnv();

const app = new App(
    [new UserController(), new AdminController()],
    Number(process.env.PORT),
);

app.listen();
