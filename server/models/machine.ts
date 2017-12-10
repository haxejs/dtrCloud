var app = require('../../server/server');
import {Push,DeviceType,MsgType,DeployStatus} from '@xialeistudio/baidu-push';

export = function(Machine:any) {
	Machine.observe('before save', (ctx:any, next:Function) => {
		if (!ctx.where || !ctx.data) return next();

		function sendPushNotifications(tag:string,title:string,description:string){
			let baiduPushConfig = app.get("baiduPush");
			let sdk = new Push(baiduPushConfig.apiKey, baiduPushConfig.secretKey);
			let msg = sdk.buildMessage(DeviceType.Android, title, description);
			sdk.pushGroup(tag, msg, DeviceType.Android, MsgType.Notification, DeployStatus.Development)
				.then(val=>console.dir(val))
				.catch(err => console.dir(err));
		}

		async function func(){
			try{
				let currentInstance:any = await Machine.findOne({where:ctx.where});
				let temp = ctx.data.MachineMainTemp?Number(ctx.data.MachineMainTemp):0;
				if (currentInstance){
					//when batch is switched, then the batch is completed
					if (currentInstance.BatchName && currentInstance.BatchName.length>0 && currentInstance.BatchName != ctx.data.BatchName){
						await app.models.Batch.updateAll(
							{
								dtrSenderId:currentInstance.dtrSenderId,
								MachineNumber:currentInstance.MachineNumber,
								BatchName:currentInstance.BatchName
							},
							{
								completed:1
							}
						);
					}
					//when MainAlarm is changed, send an alarm
					if (ctx.data.companyId && ctx.data.Main_Alarm && currentInstance.Main_Alarm != ctx.data.Main_Alarm) {
						sendPushNotifications('' + ctx.data.companyId,'Main Alarm',ctx.data.Main_Alarm + '');
					}
					//logic to compose temperature array
					let tempArray = currentInstance.tempArray?currentInstance.tempArray:[];
					tempArray.push({x:ctx.data.updatedAt,y:temp});
					if (tempArray.length>120) tempArray.shift()
					ctx.data.tempArray = tempArray;					
				}else{
					ctx.data.tempArray = [{x:ctx.data.updatedAt,y:temp}];
					//MainAlarm is here
					if (ctx.data.companyId && ctx.data.Main_Alarm) {
						sendPushNotifications('' + ctx.data.companyId,'Main Alarm',ctx.data.Main_Alarm + '');
					}
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