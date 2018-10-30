
module.exports = function(requiredRole) {
    return (req, res, next) => {
        const hasRole = req.user.roles.some(role => role === requiredRole);

        if(hasRole) return next();
        next({
            status: 403,
            error: `requires ${requiredRole} role`
        });
    };
};
