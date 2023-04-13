
import { injectable, inject } from 'inversify';
import {
    ModelAddress,
    CreateUserRequest,
    FindUserByIdRequest,
    FindUserByEmailRequest,
    EditUserRequest,
    EditUserPasswordRequest,
    EditUserEmailRequest,
    EditUserFacebookInformationsRequest,
    EditUserMobileTokensRequest,
    FindUserByEmailVerificationIdRequest,
    UpdatePushOneSignalByUserIdRequest,
    FindUserByPasswordVerificationIdRequest,
    GetAllUsersWithInfosResponse,
    EditUserConsentVersionByIdRequest,
    CreateUserByPhoneNumberRequest
} from '../models'

import { ObjectID } from 'mongodb';

import * as bcrypt from 'bcrypt';


import { TYPES, ResponseFailure, ResponseSuccess, ResponseError } from '../../../modules/common';
import {
    StoreUser,
} from './stores';
import {

} from '../models';
import { IModelResponse } from '../../interfaces/api/index';
const sgMail = require('@sendgrid/mail');

@injectable()
export class ServiceUser {
    private smtpTransport = null;
    private htmlResetPassword: string = null;
    constructor(
        @inject(TYPES.StoreUser) private store: StoreUser,
    ) {
        sgMail.setApiKey('XXXX');
    }

    async createByPhoneNumber(newUser: CreateUserByPhoneNumberRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.getByPhoneNumber(newUser.phoneNumber);
            if (user) {
                return ResponseFailure(400, `User with this phone number ${newUser.phoneNumber.toLowerCase()} already exists`)
            }

            else {
                user = await this.store.createByPhoneNumber(newUser.phoneNumber, newUser.typeDevice);
                user = await this.store.setPhoneNumberVerificationId(user._id);
                //send sms
                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
                return ResponseSuccess(201, user);

            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async sendVerificationIdByPhoneNumber(newUser: CreateUserByPhoneNumberRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.getByPhoneNumber(newUser.phoneNumber);
            if (!user) {
                return ResponseFailure(400, `User with this phone number ${newUser.phoneNumber.toLowerCase()} does not exist`)
            }

            else {
                user = await this.store.setPhoneNumberVerificationId(user._id);
                //send sms
                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
                return ResponseSuccess(201, null);

            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async create(newUser: CreateUserRequest, host: string): Promise<IModelResponse> {
        try {
            let user = await this.store.getByEmail(newUser.email);
            if (user) {
                return ResponseFailure(400, `User with this email ${newUser.email.toLowerCase()} already exists`)
            }

            else {
                user = await this.store.createFull(newUser.firstname, newUser.lastname, newUser.email,
                    newUser.password, newUser.birthDate, newUser.photoUrl, newUser.facebookId, newUser.facebookAccessToken,
                    newUser.gender, newUser.typeDevice, newUser.phoneNumber);

                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
                return ResponseSuccess(201, user);

            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async getAll(): Promise<IModelResponse> {
        try {
            const users = await this.store.getAll();

            for (let index = 0; index < users.length; index++) {
                let user = users[index];
                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
            }

            return ResponseSuccess(200, users);

        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async countAll(): Promise<IModelResponse> {
        try {
            const users = await this.store.countAll();
            return ResponseSuccess(200, users);

        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }


    async getAllWithInfos(): Promise<IModelResponse> {
        try {
            const resp = new GetAllUsersWithInfosResponse();
            const users = await this.store.getAll();
            resp.users = users;
            //resp.usersCounter = usersCounter;
            return ResponseSuccess(200, resp);

        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async find(findUser: FindUserByIdRequest): Promise<IModelResponse> {
        try {
            const user = await this.store.get(findUser.userId);
            if (!user) {
                return ResponseFailure(400, `User with this id ${findUser.userId} not found`)
            }
            else {
                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
                return ResponseSuccess(200, user);
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async findByEmail(findUser: FindUserByEmailRequest): Promise<IModelResponse> {
        try {
            const user = await this.store.getByEmail(findUser.email.toLowerCase());
            if (!user) {
                return ResponseFailure(400, `User with this email ${findUser.email.toLowerCase()} not found`)
            }
            else {
                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
                return ResponseSuccess(200, user);
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }


    async userWithEmailExist(findUser: FindUserByEmailRequest): Promise<IModelResponse> {
        try {
            const user = await this.store.getByEmail(findUser.email.toLowerCase());
            if (!user) {
                return ResponseSuccess(200, false);
            }
            else {
                return ResponseSuccess(200, true);
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async update(editUser: EditUserRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.get(editUser.userId);
            if (!user) {
                return ResponseFailure(400, `User with this id ${editUser.userId} not found`)
            }
            else {
                const address: ModelAddress = new ModelAddress();
                address.address = editUser.address;
                address.country = editUser.country;
                address.state = editUser.state;
                address.city = editUser.city;
                user = await this.store.edit(editUser.userId, editUser.firstname, editUser.lastname, editUser.birthDate, editUser.phoneNumber,
                    editUser.gender, address, editUser.photoUrl, editUser.mobileToken, editUser.facebookId, editUser.facebookAccessToken);
                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
                return ResponseSuccess(200, user);
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async remove(removeUser: FindUserByIdRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.get(removeUser.userId);
            if (!user) {
                return ResponseFailure(400, `User with this id ${removeUser.userId} not found`)
            }
            else {
                
                const removed = await this.store.delete(removeUser.userId)
                if (removed) {
                    return ResponseSuccess(200, true);
                }
                else {
                    ResponseSuccess(200, false);
                }
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }


    async editPassword(editUser: EditUserPasswordRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.get(editUser.userId);
            if (!user) {
                return ResponseFailure(400, `User with this id ${editUser.userId} not found`)
            }
            else {
                if (await bcrypt.compare(editUser.oldPassword, user.password) == false) {
                    return (ResponseFailure(400, `User with this id ${editUser.userId} bad password`))
                }
                else {
                    user = await this.store.editPassword(editUser.userId, editUser.password);
                    return ResponseSuccess(202, true);
                }
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async editEmail(editUser: EditUserEmailRequest, host: string): Promise<IModelResponse> {
        try {
            editUser.email = editUser.email.toLowerCase();
            let user = await this.store.get(editUser.userId);
            if (!user) {
                return ResponseFailure(400, `User with this id ${editUser.userId} not found`)
            }
            else {
                user = await this.store.editEmail(editUser.userId, editUser.email);
                const findUser: FindUserByIdRequest = new FindUserByIdRequest();
                findUser.userId = editUser.userId;
                //const email = await this.sendEmailVerification(findUser, host);
                return ResponseSuccess(202, true);
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }


    async setMobileToken(editUser: EditUserMobileTokensRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.get(editUser.userId);
            if (!user) {
                return ResponseFailure(400, `User with this id ${editUser.userId} not found`)
            }
            else {
                user = await this.store.setMobileToken(editUser.userId,
                    editUser.mobileToken);
                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
                return ResponseSuccess(200, user);
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }

    async setConsentVersion(editUser: EditUserConsentVersionByIdRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.get(editUser.userId);
            const consentVersion = "XXX"
            if (!user) {
                return ResponseFailure(400, `User with this id ${editUser.userId} not found`)
            }
            else if (parseInt(consentVersion) != editUser.consentVersion) {
                return ResponseFailure(400, `Bad consent version for this user ${editUser.userId}`)
            }
            else {
                user = await this.store.setConsentVersion(editUser.userId,
                    editUser.consentVersion);
                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
                return ResponseSuccess(200, user);
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }



    async sendEmailVerification(findUser: FindUserByIdRequest, host: string): Promise<IModelResponse> {
        return new Promise<IModelResponse>(async (resolve, reject) => {
            try {
                let user = await this.store.get(findUser.userId);
                if (!user) {
                    resolve(ResponseFailure(400, `User with this id ${findUser.userId} not found`));
                }
                else {
                    user = await this.store.setEmailVerificationId(findUser.userId);
                    const link = "https://" + host + "/auth/verify?id=" + user.emailVerificationId;
                    const mailOptions = {
                        to: user.email,
                        subject: "Please confirm your Email account",
                        html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
                    }
                    this.smtpTransport.sendMail(mailOptions, async (error, response) => {
                        if (error) {
                            reject(ResponseFailure(500, error));
                        } else {
                            resolve(ResponseSuccess(202, true));
                        }
                    });
                }
            }
            catch (error) {
                return ResponseFailure(500, error)
            }
        });
    }

    async verifyEmail(findUser: FindUserByEmailVerificationIdRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.getByEmailVerificationId(findUser.emailVerificationId);
            if (!user) {
                return ResponseFailure(400, `User with this emailVerificationId ${findUser.emailVerificationId} not found`);
            }
            else {
                user = await this.store.setEmailVerified(user._id.toString());
                return ResponseSuccess(200, true);
            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }



    async setFacebookInfos(editUser: EditUserFacebookInformationsRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.get(editUser.userId);
            if (!user) {
                return ResponseFailure(400, `User with this id ${editUser.userId} not found`)
            }
            else {
                user = await this.store.setFacebookInfos(editUser.userId,
                    editUser.facebookId, editUser.facebookAccessToken);
                delete user.emailVerificationId;
                delete user.password;
                delete user.oldPasswords;
                delete user.accessToken;
                return ResponseSuccess(200, user);

            }
        }
        catch (error) {
            return ResponseFailure(500, error)
        }
    }


    async setPushToken(findUser: UpdatePushOneSignalByUserIdRequest): Promise<IModelResponse> {
        try {
            let user = await this.store.get(findUser.userId);
            if (!user) {
                return ResponseFailure(400, `User with this id ${findUser.userId} not found`)
            }
            const data = await this.store.setPushToken(findUser.userId, findUser.pushToken, findUser.userIdOneSignal);
            delete data.emailVerificationId;
            delete data.password;
            delete data.oldPasswords;
            delete data.accessToken;
            return ResponseSuccess(200, data);

        }
        catch (error) {
            return ResponseFailure(500, error)
        }

    }

    async forgetPassword(findUser: FindUserByEmailRequest, host: string): Promise<IModelResponse> {
        return new Promise<IModelResponse>(async (resolve) => {
            findUser.email = findUser.email.toLowerCase();
            let user = await this.store.getByEmail(findUser.email);
            if (!user) {
                resolve(ResponseFailure(400, `User with this email ${findUser.email} not found`))
            }
            else {
                user = await this.store.generatePassword(user._id.toString());
                let body = this.htmlResetPassword.replace('{{PASSWORD_VALUE}}', user.password);
                const msg = {
                    to: user.email,
                    from: 'no-reply@vobo.fr',
                    subject: 'Réinitialisation de votre mot de passe VOBO',
                    //text: 'and easy to do anywhere, even with Node.js',
                    html: body,
                };
                sgMail.send(msg).then(result => {
                    resolve(ResponseSuccess(200, `User with this email ${findUser.email} password reset sent`));
                }, err => {
                    resolve(ResponseFailure(400, `User with this email ${findUser.email} password reset not sent`))
                });
            }
        });
    }

    async sendPasswordVerification(findUser: FindUserByEmailRequest, host: string): Promise<IModelResponse> {
        return new Promise<IModelResponse>(async (resolve) => {
            let user = await this.store.getByEmail(findUser.email);
            if (!user) {
                resolve(ResponseFailure(400, `User with this email ${findUser.email} not found`))
            }
            else {
                user = await this.store.setPasswordVerificationId(user._id.toString());
                const link = "https://" + host + "/auth/resetPassword?passwordVerificationId=" + user.passwordVerificationId;
                const mailOptions = {
                    to: user.email,
                    subject: "Reset password",
                    html: "Hello,<br> Please Click on the link to reset your password.<br><a href=" + link + ">Click here to generate password</a>"
                }
                this.smtpTransport.sendMail(mailOptions, async (error, response) => {
                    if (error) {
                        resolve(ResponseFailure(400, `User with this email ${findUser.email} password reset not sent`))
                    } else {
                        resolve(ResponseSuccess(200, `User with this email ${findUser.email} password reset sent`));
                    }
                });
            }
        });
    }
    async generatePassword(editUser: FindUserByPasswordVerificationIdRequest): Promise<IModelResponse> {
        return new Promise<IModelResponse>(async (resolve) => {
            let user = await this.store.getByPasswordVerificationId(editUser.passwordVerificationId);
            if (!user) {
                resolve(ResponseFailure(400, `User with this passwordVerificationId ${editUser.passwordVerificationId} not found`));
            }
            else {

                user = await this.store.generatePassword(user._id.toString());
                if (user) {
                    const mailOptions = {
                        to: user.email,
                        subject: "New password",
                        html: "Hello,<br> your new password is : <br>" + user.password + "</a>"
                    }
                    this.smtpTransport.sendMail(mailOptions, async (error, response) => {
                        if (error) {
                            resolve(ResponseFailure(400, `User with this email ${user.email} password reset not sent`))
                        } else {
                            resolve(ResponseSuccess(200, `User with this email ${user.email} password reset sent`));
                        }
                    });

                }
                else
                    resolve(null);
            }
        });
    }
}