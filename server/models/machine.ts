var app = require('../../server/server');

export = function(Machine:any) {
	Machine.observe('before save', (ctx:any, next:Function) => {
		if (!ctx.where || !ctx.data) return next();

		async function func(){
			try{
				let currentInstance:any = await Machine.findOne({where:ctx.where});
				let temp = ctx.data.MachineMainTemp?Number(ctx.data.MachineMainTemp):0;
				if (currentInstance){
					//when batch is switched, then the batch is completed
					if (currentInstance.BatchName && currentInstance.BatchName.length>0 && currentInstance.BatchName != ctx.data.BatchName){
						await app.models.Batch.upsertWithWhere(
							{
								dtrSenderId:currentInstance.dtrSenderId,
								MachineNumber:currentInstance.MachineNumber,
								BatchName:currentInstance.BatchName
							},
							{
								dtrSenderId:currentInstance.dtrSenderId,
								dtrSenderName:currentInstance.dtrSenderName,
								companyId:currentInstance.companyId,
								companyName:currentInstance.companyName,
								MachineNumber:currentInstance.MachineNumber,
								BatchName:currentInstance.BatchName,
								MachineName:currentInstance.MachineName,
								Loading:currentInstance.Loading,
								Water_Vol1_Total:currentInstance.Water_Vol1_Total,
								Water_Vol2_Total:currentInstance.Water_Vol2_Total,
								Water_Vol3_Total:currentInstance.Water_Vol3_Total,
								Water_Vol4_Total:currentInstance.Water_Vol4_Total,
								Steam_Vol_Total:currentInstance.Steam_Vol_Total,
								Power_Total:currentInstance.Power_Total,
								completed:1,
								updatedAt:new Date()
							}
						);
					}
					//logic to compose temperature array
					let tempArray = currentInstance.tempArray?currentInstance.tempArray:[];
					tempArray.push({x:ctx.data.updatedAt,y:temp});
					if (tempArray.length>120) tempArray.shift()
					ctx.data.tempArray = tempArray;					
				}else{
					ctx.data.tempArray = [{x:ctx.data.updatedAt,y:temp}]
				}				
			}catch(err){
				console.dir(err);
			}
			//should call next() here or data change in async function will be lost 
			next();		
		};

		func();
	});
}