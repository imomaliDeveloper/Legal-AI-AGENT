"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationStatus = exports.ApprovalAction = exports.UserRole = exports.AIProvider = exports.DifficultyLevel = exports.LegalDomain = exports.ContentType = exports.ContentStatus = void 0;
var ContentStatus;
(function (ContentStatus) {
    ContentStatus["DISCOVERED"] = "DISCOVERED";
    ContentStatus["RESEARCHED"] = "RESEARCHED";
    ContentStatus["DRAFT"] = "DRAFT";
    ContentStatus["VERIFIED"] = "VERIFIED";
    ContentStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    ContentStatus["APPROVED"] = "APPROVED";
    ContentStatus["SCHEDULED"] = "SCHEDULED";
    ContentStatus["PUBLISHED"] = "PUBLISHED";
    ContentStatus["REJECTED"] = "REJECTED";
    ContentStatus["FAILED"] = "FAILED";
    ContentStatus["UNVERIFIED"] = "UNVERIFIED";
    ContentStatus["ARCHIVED"] = "ARCHIVED";
})(ContentStatus || (exports.ContentStatus = ContentStatus = {}));
var ContentType;
(function (ContentType) {
    ContentType["NEWS"] = "NEWS";
    ContentType["EDUCATIONAL_ARTICLE"] = "EDUCATIONAL_ARTICLE";
    ContentType["CASE_STUDY"] = "CASE_STUDY";
    ContentType["QUIZ"] = "QUIZ";
    ContentType["INFOGRAPHIC"] = "INFOGRAPHIC";
    ContentType["QA_RESPONSE"] = "QA_RESPONSE";
})(ContentType || (exports.ContentType = ContentType = {}));
var LegalDomain;
(function (LegalDomain) {
    LegalDomain["CONSTITUTIONAL"] = "CONSTITUTIONAL";
    LegalDomain["CIVIL"] = "CIVIL";
    LegalDomain["CRIMINAL"] = "CRIMINAL";
    LegalDomain["ADMINISTRATIVE"] = "ADMINISTRATIVE";
    LegalDomain["LABOR"] = "LABOR";
    LegalDomain["FAMILY"] = "FAMILY";
    LegalDomain["TAX"] = "TAX";
    LegalDomain["BUSINESS"] = "BUSINESS";
    LegalDomain["HUMAN_RIGHTS"] = "HUMAN_RIGHTS";
})(LegalDomain || (exports.LegalDomain = LegalDomain = {}));
var DifficultyLevel;
(function (DifficultyLevel) {
    DifficultyLevel["BEGINNER"] = "BEGINNER";
    DifficultyLevel["INTERMEDIATE"] = "INTERMEDIATE";
    DifficultyLevel["ADVANCED"] = "ADVANCED";
})(DifficultyLevel || (exports.DifficultyLevel = DifficultyLevel = {}));
var AIProvider;
(function (AIProvider) {
    AIProvider["GEMINI"] = "GEMINI";
    AIProvider["CLAUDE"] = "CLAUDE";
})(AIProvider || (exports.AIProvider = AIProvider = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["EDITOR"] = "EDITOR";
    UserRole["VIEWER"] = "VIEWER";
})(UserRole || (exports.UserRole = UserRole = {}));
var ApprovalAction;
(function (ApprovalAction) {
    ApprovalAction["APPROVE"] = "APPROVE";
    ApprovalAction["REJECT"] = "REJECT";
    ApprovalAction["EDIT"] = "EDIT";
})(ApprovalAction || (exports.ApprovalAction = ApprovalAction = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["UNVERIFIED"] = "UNVERIFIED";
    VerificationStatus["PARTIALLY_VERIFIED"] = "PARTIALLY_VERIFIED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
//# sourceMappingURL=index.js.map