// Define HTML elements
const HTML = {
  // User
  "#user-id-input": document.querySelector("#user-id-input"),
  "#search-user-btn": document.querySelector("#search-user-btn"),
  "#user-error": document.querySelector("#user-error"),
  "#user-error-text": document.querySelector("#user-error-text"),
  "#user-profile-card": document.querySelector("#user-profile-card"),
  "#user-avatar": document.querySelector("#user-avatar"),
  "#user-name": document.querySelector("#user-name"),
  "#user-email": document.querySelector("#user-email"),
  "#user-phone": document.querySelector("#user-phone"),
  "#user-website": document.querySelector("#user-website"),
  "#user-company": document.querySelector("#user-company"),
  "#user-address": document.querySelector("#user-address"),
  "#user-loading": document.querySelector("#user-loading"),

  // Posts
  "#posts-section": document.querySelector("#posts-section"),
  "#posts-loading": document.querySelector("#posts-loading"),
  "#posts-error": document.querySelector("#posts-error"),
  "#posts-error-text": document.querySelector("#posts-error-text"),
  "#posts-container": document.querySelector("#posts-container"),
  "#load-more-posts-btn": document.querySelector("#load-more-posts-btn"),

  // Todos
  "#todo-user-id-input": document.querySelector("#todo-user-id-input"),
  "#load-todos-btn": document.querySelector("#load-todos-btn"),
  "#todo-filters": document.querySelector("#todo-filters"),
  "#filter-all": document.querySelector("#filter-all"),
  "#filter-completed": document.querySelector("#filter-completed"),
  "#filter-incomplete": document.querySelector("#filter-incomplete"),
  "#todo-stats": document.querySelector("#todo-stats"),
  "#total-todos": document.querySelector("#total-todos"),
  "#completed-todos": document.querySelector("#completed-todos"),
  "#incomplete-todos": document.querySelector("#incomplete-todos"),
  "#todos-loading": document.querySelector("#todos-loading"),
  "#todos-error": document.querySelector("#todos-error"),
  "#todos-error-text": document.querySelector("#todos-error-text"),
  "#todo-list": document.querySelector("#todo-list"),
};

async function sendRequest(method, url, retry = true) {
  try {
    const response = await fetch(url, { method });

    if (!response.ok) {
      if (retry) {
        // Retry sau 2s
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return await sendRequest(method, url, false);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return await response.json();
  } catch (error) {
    if (retry) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return await sendRequest(method, url, false);
    } else {
      throw error;
    }
  }
}

// User
function showUserError(message) {
  HTML["#user-error"].classList.add("show");
  HTML["#user-error-text"].textContent = message;
}

function hideUserError() {
  HTML["#user-error"].classList.remove("show");
}

function showUserProfile(user) {
  HTML["#user-profile-card"].classList.add("show");
  HTML["#user-avatar"].textContent = DOMPurify.sanitize(user.name.charAt(0).toUpperCase());
  HTML["#user-name"].textContent = DOMPurify.sanitize(user.name);
  HTML["#user-email"].textContent = DOMPurify.sanitize(user.email);
  HTML["#user-phone"].textContent = DOMPurify.sanitize(user.phone);
  HTML["#user-website"].textContent = DOMPurify.sanitize(user.website);
  HTML["#user-company"].textContent = DOMPurify.sanitize(user.company.name);
  HTML["#user-address"].textContent = DOMPurify.sanitize(
    `${user.address.suite}, ${user.address.street}, ${user.address.city}, ${user.address.zipcode}`
  );
}

function hideUserProfile() {
  HTML["#user-profile-card"].classList.remove("show");
}

HTML["#search-user-btn"].addEventListener("click", async () => {
  const userId = HTML["#user-id-input"].value;

  if (!userId) {
    showUserError("User ID không được để trống");
    hideUserProfile();
    return;
  }

  HTML["#user-loading"].classList.add("show");
  hideUserError();
  hideUserProfile();

  try {
    const user = await sendRequest("GET", `https://jsonplaceholder.typicode.com/users/${userId}`);
    hideUserError();
    showUserProfile(user);
  } catch (error) {
    console.log(error);
    if (error.message.includes("404")) {
      showUserError("User không tồn tại");
    } else {
      showUserError("Có lỗi xảy ra khi tải thông tin user");
    }
    hideUserProfile();
  } finally {
    HTML["#user-loading"].classList.remove("show");
  }
});

// Posts
const POSTS_LIMIT = 5;
let postPage = 1;
let usersMap = null;

async function showComments(element) {
  const postId = element.dataset.postId;
  const commentsContainer = element.nextElementSibling;
  const originTextContent = element.textContent;

  element.textContent = "Đang tải...";

  try {
    const comments = await sendRequest("GET", `https://jsonplaceholder.typicode.com/posts/${postId}/comments`);
    commentsContainer.classList.add("show");
    commentsContainer.innerHTML = comments
      .map(
        (comment) => `
          <div class="comment-item">
            <div class="comment-author">${DOMPurify.sanitize(comment.name)}</div>
            <div class="comment-email">${DOMPurify.sanitize(comment.email)}</div>
            <div class="comment-body">${DOMPurify.sanitize(comment.body)}</div>
          </div>
        `
      )
      .join("");
  } catch (error) {
    commentsContainer.innerHTML = `<p class="error">Không tải được comments</p>`;
  } finally {
    element.textContent = originTextContent;
  }
}

function renderPost(posts) {
  HTML["#posts-container"].innerHTML += posts
    .map(
      (post) => `
        <div class="post-item" data-post-id="${DOMPurify.sanitize(post.id)}">
            <h4 class="post-title">${DOMPurify.sanitize(post.title)}</h4>
            <p class="post-body">${DOMPurify.sanitize(post.body)}</p>
            <p class="post-author">Tác giả: 
                    <span class="author-name" data-user-id="${DOMPurify.sanitize(post.userId)}">
                            ${DOMPurify.sanitize(usersMap[post.userId].name)}
                    </span>
            </p>
            <button class="show-comments-btn" data-post-id="${DOMPurify.sanitize(
              post.id
            )}" onclick="showComments(this)">
                    Xem comments
            </button>
            <div class="comments-container" data-post-id="${DOMPurify.sanitize(post.id)}">
                    <!-- Comments sẽ được load động -->
            </div>
        </div>
        `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  HTML["#posts-loading"].classList.add("show");
  HTML["#posts-error"].classList.remove("show");
  HTML["#posts-container"].innerHTML = "";
  HTML["#load-more-posts-btn"].classList.remove("show");

  try {
    const users = await sendRequest("GET", "https://jsonplaceholder.typicode.com/users");
    usersMap = users.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});

    const posts = await sendRequest(
      "GET",
      `https://jsonplaceholder.typicode.com/posts?_limit=${POSTS_LIMIT}&_page=${postPage}`
    );

    renderPost(posts);
    HTML["#load-more-posts-btn"].classList.add("show");
  } catch (error) {
    HTML["#posts-error"].classList.add("show");
    HTML["#posts-error-text"].textContent = "Có lỗi xảy ra khi tải posts";
  } finally {
    HTML["#posts-loading"].classList.remove("show");
  }
});

HTML["#load-more-posts-btn"].addEventListener("click", async (e) => {
  const originTextContent = e.target.textContent;
  e.target.textContent = "Đang tải...";

  try {
    const posts = await sendRequest(
      "GET",
      `https://jsonplaceholder.typicode.com/posts?_limit=${POSTS_LIMIT}&_page=${++postPage}`
    );
    if (posts.length) {
      renderPost(posts);
    } else {
      e.target.classList.remove("show");
    }
  } finally {
    e.target.textContent = originTextContent;
  }
});

// Todos
let filter = "all";

function showTodoError(message) {
  HTML["#todos-error"].classList.add("show");
  HTML["#todos-error-text"].textContent = message;
}

function hideTodoError() {
  HTML["#todos-error"].classList.remove("show");
}

function renderTodoList(todos) {
  HTML["#todo-list"].innerHTML = todos
    .map(
      (todo) => `
            <div class="todo-item ${todo.completed ? "completed" : "incomplete"}" data-todo-id="${DOMPurify.sanitize(
        todo.id
      )}" data-completed="${DOMPurify.sanitize(todo.completed)}">
                    <div class="todo-checkbox"></div>
                    <div class="todo-text">${DOMPurify.sanitize(todo.title)}</div>
            </div>
        `
    )
    .join("");
}

function applyFilter(target) {
  const items = HTML["#todo-list"].children;

  if (target) {
    document.querySelector(".filter-btn.active")?.classList.remove("active");
    target.classList.add("active");
  }

  for (const item of items) {
    const completed = item.dataset.completed === "true";
    if (filter === "all" || (filter === "completed" && completed) || (filter === "incomplete" && !completed)) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  }
}

function renderTodoStats(todos) {
  let completed = 0;

  for (const todo of todos) {
    if (todo.completed) {
      completed++;
    }
  }

  const total = todos.length;
  const incomplete = total - completed;

  HTML["#total-todos"].textContent = total;
  HTML["#completed-todos"].textContent = completed;
  HTML["#incomplete-todos"].textContent = incomplete;
}

HTML["#load-todos-btn"].addEventListener("click", async () => {
  const userId = HTML["#todo-user-id-input"].value;

  if (!userId) {
    showTodoError("User ID không được để trống");
    renderTodoList([]);
    renderTodoStats([]);
    return;
  }

  HTML["#todos-loading"].classList.add("show");
  hideTodoError();
  renderTodoList([]);

  try {
    const todos = await sendRequest("GET", `https://jsonplaceholder.typicode.com/users/${userId}/todos`);
    hideTodoError();
    renderTodoStats(todos);
    renderTodoList(todos);
    applyFilter();
  } catch (error) {
    if (error.message.includes("404")) {
      showTodoError("User không tồn tại");
    } else {
      showTodoError("Có lỗi xảy ra khi tải todos");
    }
  } finally {
    HTML["#todos-loading"].classList.remove("show");
  }
});

function updateFilterActive(target) {}

HTML["#filter-all"].addEventListener("click", (e) => {
  filter = "all";
  applyFilter(e.target);
});
HTML["#filter-completed"].addEventListener("click", (e) => {
  filter = "completed";
  applyFilter(e.target);
});
HTML["#filter-incomplete"].addEventListener("click", (e) => {
  filter = "incomplete";
  applyFilter(e.target);
});
