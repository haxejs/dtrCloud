var app = require('../../server/server');
import {ROLES} from '../../../shared/const';


export = function(Event:any) {
	Event.beforeRemote('create',function(ctx:any,unused:any,next:Function){	  
	  var accessToken = ctx.req.accessToken;
	  if (!accessToken || !accessToken.userId){
	    var err:any = new Error('Invalid Access Token');
	    err['statusCode'] = 400;
	    err['code'] = 'INVALID_TOKEN';
	    return next(err);
	  };

	 //  app.models.Customer.findById(accessToken.userId).then((caller:any) => {
	 //  	if (!caller || caller.roleName != ROLES.DTR){
	 //  		var err:any = new Error('The role is wrong');
		//     err['statusCode'] = 400;
		//     err['code'] = 'ROLE_NAME_WRONG';
		//     throw err;
	 //  	}
	 //  	ctx.args.data.dtrSenderId = caller.id;		
		// ctx.args.data.dtrSenderName = caller.fullName;
	 //  	return caller.company();
	 //  }).then((company:any) => {
	 //  	if (company){		
		// 	ctx.args.data.companyId = company.id;
		// 	ctx.args.data.companyName = company.name;
		// }
		// return app.models.Machine.upsertWithWhere(
		// 	{dtrSenderId:ctx.args.data.dtrSenderId,MachineNumber:ctx.args.data.MachineNumber},
		// 	ctx.args.data);
	 //  }).then((machine:any) => {
	 //  	return app.models.Batch.upsertWithWhere(
		// 	{dtrSenderId:ctx.args.data.dtrSenderId,MachineNumber:ctx.args.data.MachineNumber,BatchName:ctx.args.data.BatchName},
		// 	ctx.args.data,
		// 	next);
	 //  }).catch(next);

	  app.models.Customer.findById(accessToken.userId, {}, function (err:any, caller:any) {
	    if (err || !caller) return next(err);
	    if (caller.roleName != ROLES.DTR){
		    var err:any = new Error('The role is wrong');
		    err['statusCode'] = 400;
		    err['code'] = 'ROLE_NAME_WRONG';
		    return next(err);
		}
		caller.company(function(err:any,company:any){
			if (err) return next(err);
			if (company){		
				ctx.args.data.companyId = company.id;
				ctx.args.data.companyName = company.name;
			}		
			ctx.args.data.dtrSenderId = caller.id;		
			ctx.args.data.dtrSenderName = caller.fullName;

			app.models.Machine.upsertWithWhere(
				{
					dtrSenderId:ctx.args.data.dtrSenderId,
					MachineNumber:ctx.args.data.MachineNumber
				},
				Object.assign({updatedAt:new Date()},ctx.args.data),
				function(err:any){
					if (err) return next(err);
					app.models.Batch.upsertWithWhere(
						{
							dtrSenderId:ctx.args.data.dtrSenderId,
							MachineNumber:ctx.args.data.MachineNumber,
							BatchName:ctx.args.data.BatchName
						},
						{
							dtrSenderId:ctx.args.data.dtrSenderId,
							dtrSenderName:ctx.args.data.dtrSenderName,
							companyId:ctx.args.data.companyId,
							companyName:ctx.args.data.companyName,
							MachineNumber:ctx.args.data.MachineNumber,
							BatchName:ctx.args.data.BatchName,
							MachineName:ctx.args.data.MachineName,
							Loading:ctx.args.data.Loading,
							Water_Vol1_Total:ctx.args.data.Water_Vol1_Total,
							Water_Vol2_Total:ctx.args.data.Water_Vol2_Total,
							Water_Vol3_Total:ctx.args.data.Water_Vol3_Total,
							Water_Vol4_Total:ctx.args.data.Water_Vol4_Total,
							Steam_Vol_Total:ctx.args.data.Steam_Vol_Total,
							Power_Total:ctx.args.data.Power_Total,
							updatedAt:new Date()
						},
						next
					);
				}
			);			
		});		
	  });

	});
}