import { BootScript } from '@mean-expert/boot-script';
var Agenda:any = require('agenda');
var Agendash:any = require('agendash');

@BootScript()
class Root {
    constructor(app: any) {
        app.agenda = new Agenda({processEvery: '1 minute'});        

        var router = app.loopback.Router();
        router.get('/status', app.loopback.status());
        router.use('/agendash', Agendash(app.agenda));
        app.use(router);

        //start agenda...
        var settings = app.models.agendaJobs.dataSource.connector.settings;
        if (settings.connector == 'mongodb'){
            app.agenda.database(settings.url);
        }else{
            console.error("Agenda needs mongodb datasource to run!");
        }

        app.agenda.define('heartBeatCheck', (job: any, done: Function) => {
            app.models.Customer.findById(job.attrs.data.userId, function (err: any, user: any) {
                if (err || !user) return done();
                if (user.deadChecks==5){
                    app.models.Machine.updateAll({dtrSenderId:user.id},{OnLine:0});
                }
                user.deadChecks++;
                if (user.deadChecks>3660) user.deadChecks = 60;//reset deadChecks to become Nah
                user.save();
                done();
            });
        });

        app.agenda.on('ready', function () {
            app.agenda.start();

            var baseUrl = app.get('url').replace(/\/$/, '');
            console.log("Agenda started,check agenda jobs at %s/agendash/", baseUrl);
        });

        function graceful() {
            app.agenda.stop(function () {
                process.exit(0);
            });
        }
        
        process.on('SIGTERM', graceful);
        process.on('SIGINT', graceful);
    }
}

module.exports = Root;
