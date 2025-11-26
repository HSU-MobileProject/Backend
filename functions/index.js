const admin = require("firebase-admin");
admin.initializeApp();

// 각 모듈 파일 불러오기 (중복 제거 및 경로 통일)
const authLogic = require("./src/auth");
const notiLogic = require("./src/notifications");
const payLogic = require("./src/payments");
const likeLogic = require("./src/likes");
const chatLogic = require("./src/chat");
const projectLogic = require("./src/projects"); // 검색 키워드 생성 트리거

const projectCRUD = require("./src/projects/crud");
const projectFavorites = require("./src/projects/favorite");
const projectSearch = require("./src/projects/search");

// 함수 내보내기 (Cloud Functions에 배포될 이름)
// Auth
exports.createProfile = authLogic.createProfile;
exports.deleteProfile = authLogic.deleteProfile;

// Notification & Chat
exports.sendChatNotification = notiLogic.sendChatNotification;
exports.updateChatRoomLastMessage = chatLogic.updateChatRoomLastMessage;
exports.onPaymentCreate = notiLogic.onPaymentCreate;

// Project & Likes
exports.generateKeywords = projectLogic.generateKeywords; // 검색 키워드 생성
exports.onLikeChange = likeLogic.onLikeChange; // 좋아요 카운트 동기화

//API 요청
// Payment
exports.createPayment = payLogic.createPayment;

// Project CRUD
exports.createProject = projectCRUD.createProject;
exports.listProjects = projectCRUD.listProjects;
exports.getProject = projectCRUD.getProject;
exports.updateProject = projectCRUD.updateProject;
exports.deleteProject = projectCRUD.deleteProject;

// Favorites
exports.addFavorite = projectFavorites.addFavorite;
exports.removeFavorite = projectFavorites.removeFavorite;
exports.listFavorites = projectFavorites.listFavorites;

// Search
exports.searchProjects = projectSearch.searchProjects;
exports.filterByCategory = projectSearch.filterByCategory;