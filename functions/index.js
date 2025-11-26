const admin = require('firebase-admin');
admin.initializeApp();

// 각 모듈 불러오기
const authLogic = require('./src/auth');
const notiLogic = require('./src/notifications');
const payLogic = require('./src/payments');
const projectCRUD = require('./src/projects/crud');
const projectFavorites = require('./src/projects/favorite');
const projectSearch = require('./src/projects/search');

// 함수 내보내기 (Cloud Functions에 배포될 이름)
exports.createProfile = authLogic.createProfile;
exports.deleteProfile = authLogic.deleteProfile;
exports.sendChatNotification = notiLogic.sendChatNotification;
exports.verifyPayment = payLogic.verifyPayment;

// 프로젝트 CRUD
exports.createProject = projectCRUD.createProject;
exports.listProjects = projectCRUD.listProjects;
exports.getProject = projectCRUD.getProject;
exports.updateProject = projectCRUD.updateProject;
exports.deleteProject = projectCRUD.deleteProject;

// 즐겨찾기
exports.addFavorite = projectFavorites.addFavorite;
exports.removeFavorite = projectFavorites.removeFavorite;
exports.listFavorites = projectFavorites.listFavorites;

// 검색/필터
exports.searchProjects = projectSearch.searchProjects;
exports.filterByCategory = projectSearch.filterByCategory;