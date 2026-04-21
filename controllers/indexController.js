function getLandingPage(req, res, next){
    try{
        res.render("index", {
            title: "Members Only"
        });
    }
    catch(err){
        next(err);
    }
}

module.exports = {
    getLandingPage,
}