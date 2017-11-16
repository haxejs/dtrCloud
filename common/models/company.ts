var app = require('../../server/server');

export = function(Company:any) {
	function validateOwnership(ctx:any,unused:any,next:Function){
	  app.models.Customer.findById(ctx.req.accessToken.userId).then((caller:any) => {
	  	if (!caller.companyId || caller.companyId.toString()==ctx.instance.id.toString()) return next();
	  	var err:any = new Error("Not allowed to access other company");
        err['statusCode'] = 400;
        err['code'] = 'NOT_ALLOWED_TO_ACCESS_OTHER_COMPANY';
        next(err);
	  }).catch(next);
	}

	Company.beforeRemote('findById',validateOwnership);
	Company.beforeRemote('prototype.__get__batches',validateOwnership);
	Company.beforeRemote('prototype.__get__machines',validateOwnership);
	Company.beforeRemote('prototype.__get__users',validateOwnership);
}