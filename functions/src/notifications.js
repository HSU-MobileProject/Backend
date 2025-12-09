const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

//채팅 알림
// 채팅 메시지가 생성되면 알림 발송
exports.sendChatNotification = functions.firestore
    .document("chatRooms/{roomId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const roomId = context.params.roomId;

        // 채팅방 정보 가져오기
        const roomSnap = await admin.firestore().collection("chatRooms").doc(roomId).get();
        if (!roomSnap.exists) return null;

        const roomData = roomSnap.data();
        const participants = roomData.participants;

        // 수신자 찾기 (자신이 아닌 사람)
        // 20. receiverUid code is fine
        const receiverUid = participants.find(uid => uid !== message.senderId);
        if (!receiverUid) return null;

        // 발신자 정보 가져오기 (이름 표시용)
        const senderSnap = await admin.firestore().collection("users").doc(message.senderId).get();
        const senderName = senderSnap.data()?.displayName || "알 수 없는 사용자";

        // 수신자의 FCM 토큰 가져오기
        const userSnap = await admin.firestore().collection("users").doc(receiverUid).get();
        const fcmToken = userSnap.data()?.fcmToken;

        // 알림 데이터 생성 (DB에 저장) - Frontend 구조에 맞춤
        await admin.firestore().collection("notifications").add({
            userId: message.senderId,
            receiverId: receiverUid,
            type: "message",
            action: "메시지를 보냈습니다.",
            target: roomData.title || senderName,
            roomId: roomId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (!fcmToken) {
            console.log("FCM 토큰이 없습니다.");
            return null;
        }

        // 알림 메시지 구성 (FCM용)
        const payload = {
            notification: {
                title: "새로운 메시지",
                body: message.text.length > 20 ? message.text.substring(0, 20) + "..." : message.text,
            },
            data: {
                roomId: roomId,
                click_action: "FLUTTER_NOTIFICATION_CLICK"
            }
        };

        return admin.messaging().sendToDevice(fcmToken, payload);
    });

//결제 알림
// 결제(payments) 문서가 생성되면 -> 알림(notifications) 문서 자동 생성
exports.onPaymentCreate = functions.firestore
    .document("payments/{paymentId}")
    .onCreate(async (snap, context) => {
        const payment = snap.data();
        const buyerUid = payment.userId || payment.buyerUid;

        // 알림 데이터 생성 (DB에 저장)
        await admin.firestore().collection("notifications").add({
            userId: "system", // Frontend expects "system" for system messages
            receiverId: buyerUid,
            type: "system", // Changed from "payment" to "system" to match frontend styles
            action: "결제가 완료되었습니다.",
            target: "포인트 충전", // 구체적인 대상 명시
            body: `${payment.amount}원 결제가 완료되었습니다.`,
            paymentId: context.params.paymentId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });

// 즐겨찾기 알림
exports.sendLikeNotification = functions.firestore
    .document("userLikes/{userId}/projects/{projectId}")
    .onCreate(async (snap, context) => {
        const projectId = context.params.projectId;
        const likerId = context.params.userId; // 즐겨찾기 누른 사람

        // 프로젝트 정보 가져오기 (주인 찾기)
        const projectSnap = await admin.firestore().collection("projects").doc(projectId).get();
        if (!projectSnap.exists) return null;

        const projectData = projectSnap.data();
        const ownerId = projectData.ownerId;

        // 자기 자신이 누른 즐겨찾기는 알림 제외
        if (likerId === ownerId) return null;

        // 즐겨찾기 누른 사람 정보 가져오기 (이름 표시용 - FCM 알림용)
        const likerSnap = await admin.firestore().collection("users").doc(likerId).get();
        const likerName = likerSnap.data()?.displayName || "누군가";

        // 알림 내역 저장 (DB)
        await admin.firestore().collection("notifications").add({
            userId: likerId,
            userName: likerName,
            receiverId: ownerId,
            type: "like",
            action: "프로젝트를 좋아합니다.",
            target: projectData.title,
            projectId: projectId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 주인 FCM 토큰 가져오기
        const ownerSnap = await admin.firestore().collection("users").doc(ownerId).get();
        const fcmToken = ownerSnap.data()?.fcmToken;
        if (!fcmToken) return null;

        // 알림 전송 (FCM)
        const payload = {
            notification: {
                title: "새로운 즐겨찾기!",
                body: `${likerName}님이 회원님의 '${projectData.title}' 프로젝트를 즐겨찾기에 추가했습니다.`,
            },
            data: {
                projectId: projectId,
                click_action: "FLUTTER_NOTIFICATION_CLICK"
            }
        };

        return admin.messaging().sendToDevice(fcmToken, payload);
    });

// [NEW] 지원 알림 (프로젝트 주인에게)
exports.onApplicationCreate = functions.firestore
    .document("applications/{applicationId}")
    .onCreate(async (snap, context) => {
        const application = snap.data();
        const applicantId = application.applicantId;
        const projectId = application.projectId;

        // 프로젝트 정보 (주인 찾기)
        const projectSnap = await admin.firestore().collection("projects").doc(projectId).get();
        if (!projectSnap.exists) return null;
        const projectData = projectSnap.data();
        const ownerId = projectData.ownerId;

        if (applicantId === ownerId) return null; // Self application?

        // 지원자 정보
        const applicantSnap = await admin.firestore().collection("users").doc(applicantId).get();
        const applicantName = applicantSnap.data()?.displayName || "누군가";

        // 알림 저장
        await admin.firestore().collection("notifications").add({
            userId: applicantId,
            userName: applicantName, // [추가] 이름 저장
            receiverId: ownerId,
            type: "application",
            action: "프로젝트에 지원했습니다.",
            target: projectData.title,
            projectId: projectId,
            applicationId: context.params.applicationId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // FCM 전송 (Optional)
    });

// [NEW] 지원 상태 변경 알림 (지원자에게)
exports.onApplicationUpdate = functions.firestore
    .document("applications/{applicationId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // 상태가 변경되었을 때만 (특히 'approved' 또는 'accepted')
        if (before.status === after.status) return null;

        // 예: 'approved' 상태가 승인이라고 가정
        // (사용자가 사용하는 상태값에 따라 수정 필요: '승인', '수락', 'approved' 등)
        if (after.status !== 'approved' && after.status !== '수락' && after.status !== '합격') return null;

        const applicantId = after.applicantId;
        const projectId = after.projectId;

        const projectSnap = await admin.firestore().collection("projects").doc(projectId).get();
        const projectData = projectSnap.data() || {};

        // 알림 저장
        await admin.firestore().collection("notifications").add({
            userId: "system",
            receiverId: applicantId,
            type: "system", // Or 'application_update'
            action: `지원이 승인되었습니다!`,
            target: projectData.title || "지원한 프로젝트",
            projectId: projectId,
            applicationId: context.params.applicationId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });