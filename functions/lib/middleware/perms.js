import { getUserByUid } from "../services/users.js";
export function requirePerm(action) {
    return async (req, _res, next) => {
        if (!req.user) {
            return next({ status: 401, message: "Unauthorized" });
        }
        const user = await getUserByUid(req.user.uid);
        if (!user?.permissions?.[action]) {
            return next({ status: 403, message: `Not permitted: ${action}` });
        }
        return next();
    };
}
//# sourceMappingURL=perms.js.map