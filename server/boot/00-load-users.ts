import { BootScript } from '@mean-expert/boot-script';
var log = require('debug')('boot:00-load-users');
import {ROLES} from '../../common/const';

function createDefaultUsers(app: any) {

    log('Creating roles and users');

    var User = app.models.Customer;
    var Role = app.models.Role;

    var RoleMapping = app.models.RoleMapping;
    RoleMapping.settings.strictObjectIDCoercion = true;

    var roles = [{
      name: ROLES.SU,
      users: [{
        fullName: 'Root',
        email: 'root@ugen.cn',
        username: '13556174217',
        password: 'root11'
      }]
    },
    {
      name: ROLES.VIP,
      users: []
    }, 
    {
      name: ROLES.MONITOR,
      users: []
    },
    {
      name:ROLES.ADMIN,
      users:[]
    },
    {
      name:ROLES.DTR,
      users:[]
    }];

    roles.forEach(function(role) {
      Role.findOrCreate(
        {where: {name: role.name}}, // find
        {name: role.name}, // create
        function(err:any, createdRole:any, created:boolean) {
          if (err) {
            log('error running findOrCreate('+role.name+')');
            return;
          }
          (created) ? log('created role', createdRole.name)
                    : log('found role', createdRole.name);
          role.users.forEach(function(roleUser:any) {
            roleUser.roleName = createdRole.name;
            User.findOrCreate(
              {where: {username: roleUser.username}}, // find
              roleUser, // create
              function(err:any, createdUser:any, created:boolean) {
                if (err) {
                  log('error creating roleUser');
                  return;
                }
                (created) ? log('created user', createdUser.username)
                          : log('found user', createdUser.username);
              });
          });
        });
    });
}


@BootScript()
class LoadUsers {
    constructor(app: any) {
      app.on('started', () => {
        createDefaultUsers(app);
        app.models.Company.findOrCreate({where: {name:'Demo'}},{name:'Demo'},function(err:any, company:any, created:boolean){
          app.models.Customer.findOrCreate(
            {where: {email: 'dtr@ugen.cn'}},
            {fullName: 'A',email: 'dtr@ugen.cn',password:'123456',roleName:ROLES.DTR,companyId:company.id},
            function(){}
          );
        });
      });    	
    }
}

module.exports = LoadUsers;
