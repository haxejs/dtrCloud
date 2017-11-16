var app = require('../../server/server');
import {ROLES, ALL_ROLES, COMPANY_ROLES, GLOBAL_ROLES, NON_ADMIN_ROLES} from '../../../shared/const';

function validateSave(ctx:any,unused:any,next:Function){
  var user = ctx.args.data;
  if (!!user.roleName && ALL_ROLES.indexOf(user.roleName)===-1){
    var err:any = new Error('The roleName is wrong');
    err['statusCode'] = 400;
    err['code'] = 'ROLE_NAME_WRONG';
    return next(err);
  }
  var accessToken = ctx.req.accessToken;
  if (!accessToken || !accessToken.userId){
    var err:any = new Error('Invalid Access Token');
    err['statusCode'] = 400;
    err['code'] = 'INVALID_TOKEN';
    return next(err);
  };
  app.models.Customer.findById(accessToken.userId, {}, function (err:any, caller:any) {
    if (err || !caller) next(err);
    if (caller.roleName === ROLES.ADMIN && GLOBAL_ROLES.indexOf(user.roleName) > -1) {
      var err:any = new Error('You are not allowed to bind user to su or vip role');
      err['statusCode'] = 403;
      err['code'] = 'NOT_ALLOWED_TO_EXTEND_USER_ROLE';
      next(err);
    } else if (NON_ADMIN_ROLES.indexOf(caller.roleName) > -1  && user.roleName && caller.roleName !== user.roleName) {
      var err:any = new Error("You are not allowed to change role");
      err['statusCode'] = 403;
      err['code'] = 'NOT_ALLOWED_TO_CHANGE_USER_ROLE';
      next(err);
    } else if (COMPANY_ROLES.indexOf(caller.roleName) > -1) {
      if (!!user.companyId && user.companyId.toString() !== caller.companyId.toString()) {
        var err:any = new Error("You are not allowed to change company of user");
        err['statusCode'] = 403;
        err['code'] = 'NOT_ALLOWED_TO_CHANGE_COMPANY';
        next(err);
      } else if (!ctx.instance && !user.id && !user.companyId) {
        var err:any = new Error("The companyId is blank");
        err['statusCode'] = 403;
        err['code'] = 'NOT_ALLOWED_COMPANY_TO_BE_BLANK';
        next(err);
      } else {
        next();
      }
    } else {
      next();
    }
  });
}


export = function(Customer:any) {
  Customer.observe('after save',function(ctx:any,next:Function){
    var user = ctx.instance || ctx.data;
    if (user.roleName){
      if (GLOBAL_ROLES.indexOf(user.roleName)>-1 && user.companyId){
        user.companyId = null;
        user.save();
      }
      app.models.Role.findOne({where: {name: user.roleName}},function(err:any,roleX:any){
        if (err) return next(err);
        app.models.RoleMapping.destroyAll({principalType: app.models.RoleMapping.USER,principalId: user.id},function(err:any){
          if (err) return next(err);
          if (roleX){
            roleX.principals.create({
              principalType: app.models.RoleMapping.USER,
              principalId: user.id
            },next);
          }else{
            var err:any = new Error(user.roleName + " role is not existed");
            err['statusCode'] = 400;
            err['code'] = 'ROLE_NOT_EXISTED';
            next(err);
          }
        });
      });
    }else{
      next();
    }
  });


  Customer.beforeRemote('prototype.replaceAttributes',validateSave);
  Customer.beforeRemote('prototype.updateAttributes',validateSave);

  Customer.beforeRemote('deleteById', function(ctx:any, user:any, next:Function) {
    var accessToken = ctx.req.accessToken;
    if (!accessToken || !accessToken.userId){
      var err:any = new Error('Invalid Access Token');
      err['statusCode'] = 400;
      err['code'] = 'INVALID_TOKEN';
      return next(err);
    }
    Customer.findById(ctx.args.id, {}, function (err:any, user:any) {
      if (err || !user) return next(err);
      if (user.id.toString()===accessToken.userId.toString()){
        var err:any = new Error("You are not allowed to delete yourself");
        err['statusCode'] = 403;
        err['code'] = 'NOT_ALLOWED_TO_DELETE_SELF';
        return next(err);
      }
      user.roles.destroyAll(next);
    });
  });

  Customer.prototype.heartBeat = function(next:Function){
    this.lastHeartBeat = new Date();
    this.save(next);
  };

  Customer.remoteMethod('prototype.heartBeat', {
    description: 'heartBeat',
    accessType: 'EXECUTE',
    http: [
      {verb: 'put', path: '/heartBeat'}
    ],
    accepts: [],
    returns: {arg: 'user', type: 'Customer', root: true}
  });

  // Customer.disableRemoteMethodByName("upsert");                               // disables PATCH /Customers
  // Customer.disableRemoteMethodByName("find");                                 // disables GET /Customers
  // Customer.disableRemoteMethodByName("replaceOrCreate");                      // disables PUT /Customers
  // Customer.disableRemoteMethodByName("create");                               // disables POST /Customers

  // Customer.disableRemoteMethodByName("prototype.updateAttributes");           // disables PATCH /Customers/{id}
  // Customer.disableRemoteMethodByName("findById");                             // disables GET /Customers/{id}
  // Customer.disableRemoteMethodByName("exists");                               // disables HEAD /Customers/{id}
  // Customer.disableRemoteMethodByName("replaceById");                          // disables PUT /Customers/{id}
  // Customer.disableRemoteMethodByName("deleteById");                           // disables DELETE /Customers/{id}

  // Customer.disableRemoteMethodByName('prototype.__get__accessTokens');        // disable GET /Customers/{id}/accessTokens
  // Customer.disableRemoteMethodByName('prototype.__create__accessTokens');     // disable POST /Customers/{id}/accessTokens
  // Customer.disableRemoteMethodByName('prototype.__delete__accessTokens');     // disable DELETE /Customers/{id}/accessTokens

  // Customer.disableRemoteMethodByName('prototype.__findById__accessTokens');   // disable GET /Customers/{id}/accessTokens/{fk}
  // Customer.disableRemoteMethodByName('prototype.__updateById__accessTokens'); // disable PUT /Customers/{id}/accessTokens/{fk}
  // Customer.disableRemoteMethodByName('prototype.__destroyById__accessTokens');// disable DELETE /Customers/{id}/accessTokens/{fk}

  // Customer.disableRemoteMethodByName('prototype.__count__accessTokens');      // disable  GET /Customers/{id}/accessTokens/count

  // Customer.disableRemoteMethodByName("prototype.verify");                     // disable POST /Customers/{id}/verify
  // Customer.disableRemoteMethodByName("changePassword");                       // disable POST /Customers/change-password
  // Customer.disableRemoteMethodByName("createChangeStream");                   // disable GET and POST /Customers/change-stream

  // Customer.disableRemoteMethodByName("confirm");                              // disables GET /Customers/confirm
  // Customer.disableRemoteMethodByName("count");                                // disables GET /Customers/count
  // Customer.disableRemoteMethodByName("findOne");                              // disables GET /Customers/findOne

  // Customer.disableRemoteMethodByName("login");                                // disables POST /Customers/login
  // Customer.disableRemoteMethodByName("logout");                               // disables POST /Customers/logout

  // Customer.disableRemoteMethodByName("resetPassword");                        // disables POST /Customers/reset
  // Customer.disableRemoteMethodByName("setPassword");                          // disables POST /Customers/reset-password
  // Customer.disableRemoteMethodByName("update");                               // disables POST /Customers/update
  // Customer.disableRemoteMethodByName("upsertWithWhere");                      // disables POST /Customers/upsertWithWhere   
}