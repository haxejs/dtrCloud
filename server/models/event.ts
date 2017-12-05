var app = require('../../server/server');
import {ROLES} from '../../common/const';


export = function(Event:any) {
	Event.beforeRemote('create',function(ctx:any,unused:any,next:Function){	  
	  var accessToken = ctx.req.accessToken;
	  if (!accessToken || !accessToken.userId){
	    var err:any = new Error('Invalid Access Token');
	    err['statusCode'] = 400;
	    err['code'] = 'INVALID_TOKEN';
	    return next(err);
	  };

	  var func:Function = async ()=>{
		  try {
			  //use 'include' filter here, so the relation function company() can work
			  var caller: any = await app.models.Customer.findById(accessToken.userId, { include: 'company' });
			  if (!caller || caller.roleName != ROLES.DTR) {
				  var err: any = new Error('The role is wrong');
				  err['statusCode'] = 400;
				  err['code'] = 'ROLE_NAME_WRONG';
				  throw err;
			  }
			  var company:any = await caller.company();
			  if (company) {
				  ctx.args.data.companyId = company.id;
				  ctx.args.data.companyName = company.name;
			  }
			  ctx.args.data.dtrSenderId = caller.id;
			  ctx.args.data.dtrSenderName = caller.fullName;
			  if (ctx.args.data.BatchName && ctx.args.data.BatchName.length > 0) {
				  await app.models.Batch.upsertWithWhere(
					  {
						  dtrSenderId: ctx.args.data.dtrSenderId,
						  MachineNumber: ctx.args.data.MachineNumber,
						  BatchName: ctx.args.data.BatchName
					  },
					  {
						  dtrSenderId: ctx.args.data.dtrSenderId,
						  dtrSenderName: ctx.args.data.dtrSenderName,
						  companyId: ctx.args.data.companyId,
						  companyName: ctx.args.data.companyName,
						  MachineNumber: ctx.args.data.MachineNumber,
						  BatchName: ctx.args.data.BatchName,
						  MachineName: ctx.args.data.MachineName,
						  Loading: ctx.args.data.Loading,
						  Water_Vol1_Total: ctx.args.data.Water_Vol1_Total,
						  Water_Vol2_Total: ctx.args.data.Water_Vol2_Total,
						  Water_Vol3_Total: ctx.args.data.Water_Vol3_Total,
						  Water_Vol4_Total: ctx.args.data.Water_Vol4_Total,
						  Steam_Vol_Total: ctx.args.data.Steam_Vol_Total,
						  Power_Total: ctx.args.data.Power_Total,
						  completed: 0,
						  updatedAt: new Date()
					  }
				  );
			  }

			  await app.models.Machine.upsertWithWhere(
				  {
					  dtrSenderId: ctx.args.data.dtrSenderId,
					  MachineNumber: ctx.args.data.MachineNumber
				  },
				  Object.assign({ updatedAt: new Date() }, ctx.args.data)
			  );

		  } catch (err) {
			  console.dir(err);
		  }	
		  //should call next() here or data change in async function will be lost 
		  next();	
	  };

	  func();	  
	});
}