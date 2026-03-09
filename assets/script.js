import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGLH8g-20u6zDAP2eQ0oU94DYpx5RjabI",
  authDomain: "mittens-ac688.firebaseapp.com",
  projectId: "mittens-ac688",
  storageBucket: "mittens-ac688.app",
  messagingSenderId: "524822883656",
  appId: "1:524822883656:web:b03fc3d96e6925a3da977d",
  measurementId: "G-56J6FM1TLT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export async function signUpEmail(email, password, username){
    const cred = await createUserWithEmailAndPassword(auth,email,password);
    await setDoc(doc(db,"accounts",cred.user.uid),{
        username,
        email,
        followers: [],
        following: [],
        createdAt: new Date()
    });
    window.location.href = '/feed/index.html';
}

export async function loginEmail(email,password){
    await signInWithEmailAndPassword(auth,email,password);
    window.location.href = '/feed/index.html';
}

export async function signInGoogle(){
    const result = await signInWithPopup(auth,googleProvider);
    const user = result.user;
    const accountDoc = await getDoc(doc(db,"accounts",user.uid));
    if(!accountDoc.exists()){
        await setDoc(doc(db,"accounts",user.uid),{
            username: user.displayName || "GoogleUser",
            email: user.email,
            followers: [],
            following: [],
            createdAt: new Date()
        });
    }
    window.location.href = '/feed/index.html';
}

export async function logout(){ await signOut(auth); window.location.href='/'; }

export async function postMessage(text){
    if(!text.trim()) return;
    await addDoc(collection(db,"posts"),{
        text,
        user: auth.currentUser.uid,
        timestamp: new Date(),
        likes: [],
        replies: []
    });
}

export async function toggleFollow(userId){
    const meDoc = doc(db,"accounts",auth.currentUser.uid);
    const targetDoc = doc(db,"accounts",userId);
    const meSnap = await getDoc(meDoc);
    const targetSnap = await getDoc(targetDoc);
    const meData = meSnap.data();
    const targetData = targetSnap.data();
    if(meData.following.includes(userId)){
        await updateDoc(meDoc,{following: arrayRemove(userId)});
        await updateDoc(targetDoc,{followers: arrayRemove(auth.currentUser.uid)});
    } else {
        await updateDoc(meDoc,{following: arrayUnion(userId)});
        await updateDoc(targetDoc,{followers: arrayUnion(auth.currentUser.uid)});
    }
}

export function renderFeed(postsContainer){
    const postsRef = collection(db,"posts");
    const postsQuery = query(postsRef, orderBy("timestamp","desc"));
    onSnapshot(postsQuery, async snapshot=>{
        postsContainer.innerHTML = "";
        const meSnap = await getDoc(doc(db,"accounts",auth.currentUser.uid));
        const meFollowing = meSnap.data().following.concat(auth.currentUser.uid);
        for(const docSnap of snapshot.docs){
            const data = docSnap.data();
            if(!meFollowing.includes(data.user)) continue;
            const userSnap = await getDoc(doc(db,"accounts",data.user));
            const username = userSnap.exists() ? userSnap.data().username : "Unknown";
            const postEl = document.createElement('div');
            postEl.className='post';
            postEl.innerHTML=`<p><strong>${username}</strong>: ${data.text}</p>
            <button class="likeBtn">${data.likes.includes(auth.currentUser.uid) ? '💖' : '🤍'} ${data.likes.length}</button>
            <button class="replyBtn">Reply (${data.replies.length})</button>
            <button class="followBtn">${userSnap.data().followers.includes(auth.currentUser.uid)?'Unfollow':'Follow'}</button>
            <div class="replies"></div>
            <input class="replyInput" placeholder="Reply..." style="display:none;">`;
            
            const likeBtn = postEl.querySelector('.likeBtn');
            likeBtn.addEventListener('click', async ()=>{
                const postDoc = doc(db,"posts",docSnap.id);
                if(data.likes.includes(auth.currentUser.uid)) await updateDoc(postDoc,{likes: arrayRemove(auth.currentUser.uid)});
                else await updateDoc(postDoc,{likes: arrayUnion(auth.currentUser.uid)});
            });

            const replyBtn = postEl.querySelector('.replyBtn');
            const replyInput = postEl.querySelector('.replyInput');
            replyBtn.addEventListener('click',()=>{ replyInput.style.display = replyInput.style.display==='block'?'none':'block' });
            replyInput.addEventListener('keypress', async (e)=>{
                if(e.key==="Enter"){
                    const text = e.target.value.trim();
                    if(!text) return;
                    const postDoc = doc(db,"posts",docSnap.id);
                    await updateDoc(postDoc,{replies: arrayUnion({user: auth.currentUser.uid,text})});
                    e.target.value="";
                }
            });

            const followBtn = postEl.querySelector('.followBtn');
            followBtn.addEventListener('click', ()=>{ toggleFollow(data.user); });

            const repliesDiv = postEl.querySelector('.replies');
            (data.replies||[]).forEach(r=>{
                const rSnap = r;
                const rDiv = document.createElement('div');
                rDiv.className='reply-div';
                rDiv.innerHTML=`<strong>${rSnap.user===auth.currentUser.uid?'You':rSnap.user}</strong>: ${rSnap.text}`;
                repliesDiv.appendChild(rDiv);
            });

            postsContainer.appendChild(postEl);
        }
    });
}