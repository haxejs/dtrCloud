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
			  let events = Array.isArray(ctx.args.data)?ctx.args.data:[ctx.args.data];
			  for(let i=0;i<events.length;i++){
				let event = events[i];
				if (company) {
					event.companyId = company.id;
					event.companyName = company.name;
				}
				event.dtrSenderId = caller.id;
				event.dtrSenderName = caller.fullName;
				if (event.BatchName && event.BatchName.length > 0) {
					await app.models.Batch.upsertWithWhere(
						{
							dtrSenderId: event.dtrSenderId,
							MachineNumber: event.MachineNumber,
							BatchName: event.BatchName
						},
						{
							dtrSenderId: event.dtrSenderId,
							dtrSenderName: event.dtrSenderName,
							companyId: event.companyId,
							companyName: event.companyName,
							MachineNumber: event.MachineNumber,
							BatchName: event.BatchName,
							MachineName: event.MachineName,
							Loading: event.Loading,
							Water_Vol1_Total: event.Water_Vol1_Total,
							Water_Vol2_Total: event.Water_Vol2_Total,
							Water_Vol3_Total: event.Water_Vol3_Total,
							Water_Vol4_Total: event.Water_Vol4_Total,
							Steam_Vol_Total: event.Steam_Vol_Total,
							Power_Total: event.Power_Total,
							completed: 0,
							updatedAt: new Date()
						}
					);
				}
  
				await app.models.Machine.upsertWithWhere(
					{
						dtrSenderId: event.dtrSenderId,
						MachineNumber: event.MachineNumber
					},
					Object.assign({ updatedAt: new Date() }, event)
				);
			  }		  

		  } catch (err) {
			  console.dir(err);
		  }	
		  //should call next() here or data change in async function will be lost 
		  next();	
	  };

	  func();	  
	});
}