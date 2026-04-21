function ensureLoggedIn(req, res, next){
    if(req.isAuthenticated()) return next();
    res.redirect('/log-in');
}

function ensureOwnerOrAdmin(req, res, next){
    if(!req.isAuthenticated()) return res.redirect('/log-in');

    const isOwner = req.message.user_id === req.user.id;
    const isAdmin = req.user.is_admin;

    if(isOwner || isAdmin) return next();

    const err = new Error('Forbidden');
    err.status = 403;
    next(err);
}

module.exports = {
    ensureLoggedIn,
    ensureOwnerOrAdmin,
}