const admin = require("firebase-admin");
admin.initializeApp();

// 모듈 불러오기

// [Trigger & 결제 로직]
const authLogic = require("./src/auth");
const notiLogic = require("./src/notifications");
const payLogic = require("./src/payments");
const likeLogic = require("./src/likes");
const chatLogic = require("./src/chat");
const projectLogic = require("./src/projects/triggers"); // 검색 키워드 생성 트리거

// [API 로직]
const projectCRUD = require("./src/projects/crud");
const projectFavorites = require("./src/projects/favorite");
const projectSearch = require("./src/projects/search");

const myPageLogic = require("./src/projects/mypage");

// 함수 내보내기

//[Triggers] DB 변경 감지 및 자동화 로직

// Auth
exports.createProfile = authLogic.createProfile;
exports.deleteProfile = authLogic.deleteProfile;

// Notification & Chat
exports.sendChatNotification = notiLogic.sendChatNotification;
exports.onPaymentCreate = notiLogic.onPaymentCreate;
exports.sendLikeNotification = notiLogic.sendLikeNotification;
exports.updateChatRoomLastMessage = chatLogic.updateChatRoomLastMessage;
exports.createChatRoom = chatLogic.createChatRoom;

// Project & Likes
exports.generateKeywords = projectLogic.generateKeywords; // 검색 키워드 생성
exports.onLikeChange = likeLogic.onLikeChange; // 좋아요 카운트 동기화


// [Callables] 클라이언트에서 직접 호출하는 API

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

// MyPage
exports.myProjects = mypageLogic.myProjects;
exports.getMyTransactionStats = mypageLogic.getMyTransactionStats;
exports.getMyProfile = mypageLogic.getMyProfile;
exports.updateMyProfile = mypageLogic.updateMyProfile;