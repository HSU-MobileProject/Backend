const admin = require("firebase-admin");
admin.initializeApp();

// 각 모듈 불러오기
const authLogic = require("./src/auth");
const notiLogic = require("./src/notifications");
const payLogic = require("./src/payments");
const likeLogic = require("./src/likes");
const chatLogic = require("./src/chat");
const projectLogic = require("./src/projects");

// 함수 내보내기 (Cloud Functions에 배포될 이름)
exports.createProfile = authLogic.createProfile;
exports.deleteProfile = authLogic.deleteProfile;
exports.sendChatNotification = notiLogic.sendChatNotification;
exports.onPaymentCreate = notiLogic.onPaymentCreate;
exports.createPayment = payLogic.createPayment;
exports.onLikeChange = likeLogic.onLikeChange;
exports.updateChatRoomLastMessage = chatLogic.updateChatRoomLastMessage;
exports.generateKeywords = projectLogic.generateKeywords;