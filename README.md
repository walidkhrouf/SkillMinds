SkillMinds – Skill Exchange Platform

📖 Overview
SkillMinds is a modular web platform that enables peer‑to‑peer skill exchange, personalized learning and seamless community interaction. Leveraging AI‑driven recommendations and a robust data model, it supports:

User Management with roles (learner, mentor, admin) and OAuth/social linkage

Skill Management (browse, verify, follow, recommend)

Course Management (creation, enrollment, progress tracking)

Group Management with posts, comments & likes

Recruitment Management (job offers & applications)

Tutorial Management (authoring, commenting, likes)

Activity Management (events/webinars with payment support)

Cart & Payment for paid courses and event fees

Notification System for real‑time user alerts ​

This design is underpinned by a clear MongoDB‑style schema and covers every user journey—from skill discovery to mentor review—ensuring scalability and extensibility.

⚙️ Prerequisites
Node.js

express.js

MongoDB

Docker & Docker‑Compose (optional)

OAuth Credentials for Google/LinkedIn signIn

🚀 Installation
1 Clone the repo
git clone https://github.com/walidkhrouf/SkillMinds

then open the project in the terminal 
cd DevMinds_4TWIN5_pidev

2 Install dependencies
cd backend and run npm i
cd backend then cd gemini-backend and run npmi
cd frontendReact and run npm i

3 Environment variables
You can set up the Environment variables in the file .env in backend and frontendReact to icnlude your api keys

▶️ Running the App
if you want to run this app just enter to the folder of backend and run npm star and enter to the folder of frontendReact and run npm run dev that's all.


💡 Key Features & Data Design
1 User Management

* Profiles with bio, location, phone, image, linked and google accounts.

2 Skills

* Central Skill catalog; UserSkill links users to skills (“has” vs. “wantsToLearn”).

* SkillVerification (test, mentor_review, certification);

* SkillRecommendation & SkillFollow for AI suggestions and updates.

3 Courses

* Course entity with content files; CourseEnrollment tracks progress and status.

4 Groups

* Group, GroupPost, GroupPostComment, GroupPostLike to foster community discussion.

5 Recruitment

* JobOffer and JobApplication manage offers, required skills, cover letters and resumes.

6 Tutorials

* Tutorial, TutorialComment, TutorialLike for user‑generated guides and interactions.

7 Activities & Payments

* Activity and ActivityParticipant for events (workshops, webinars) with paid creation.

* Cart and Payment schemas handle course/event fees and transactions.

8 Notifications

* Notification schema covers account updates, enrollments, verifications, reminders, etc.


Collaborators: Walid Khrouf, Saif Hlaimi, Mohamed Yassine Mighri, Feryel Yahyaoui, Ela soubi


