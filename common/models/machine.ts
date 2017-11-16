var app = require('../../server/server');

export = function(Machine:any) {
	Machine.observe('before save', (ctx:any, next:Function) => {
		if (!ctx.where || !ctx.data) return next();
		Machine.findOne({where:ctx.where},(err:any,currentInstance:any)=>{
			let temp = ctx.data.MachineMainTemp?Number(ctx.data.MachineMainTemp):0;
			if (currentInstance){
				let tempArray = currentInstance.tempArray?currentInstance.tempArray:[];
				tempArray.push({ts:ctx.data.updatedAt,temp:temp});
				if (tempArray.length>120) tempArray.shift()
				ctx.data.tempArray = tempArray;
			} else {
				ctx.data.tempArray = [{ts:ctx.data.updatedAt,temp:temp}]
			}			
			next(err);
		});
	});
}