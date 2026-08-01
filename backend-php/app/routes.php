<?php

declare(strict_types=1);

/** @var Base $f3 */

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
$f3->route('GET /', function () {
    Api::json([
        'name' => 'BookWorm PHP API',
        'framework' => 'Fat-Free',
        'status' => 'ok',
    ]);
});

$f3->route('GET /health', function () {
    try {
        Database::pdo()->query('SELECT 1');
        Api::json(['ok' => true, 'db' => true]);
    } catch (Throwable $e) {
        Api::error('Database connection failed: ' . $e->getMessage(), 500);
    }
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
$f3->route('POST /users', function () {
    Auth::requireUser();
    $body = Api::body();
    if (empty($body['firebase_uid']) || empty($body['email'])) {
        Api::error('firebase_uid and email are required', 400);
    }
    Api::json(Api::row(Users::createOrReclaim($body)));
});

$f3->route('GET /users', function ($f3) {
    $limit = Api::queryInt($f3, 'limit', 10);
    $offset = Api::queryInt($f3, 'offset', 0);
    $pdo = Database::pdo();
    $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $stmt = $pdo->prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?');
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    Api::json(['rows' => Api::rows($stmt->fetchAll()), 'count' => $count]);
});

$f3->route('GET /users/firebase/@firebaseUid', function ($f3, $params) {
    $user = Users::findByFirebaseUid($params['firebaseUid']);
    if (!$user) {
        Api::error('User with Firebase UID ' . $params['firebaseUid'] . ' not found', 404);
    }
    Api::json(Api::row($user));
});

$f3->route('GET /users/email/@email', function ($f3, $params) {
    $user = Users::findByEmail($params['email']);
    if (!$user) {
        Api::error('User with email ' . $params['email'] . ' not found', 404);
    }
    Api::json(Api::row($user));
});

$f3->route('GET /users/@id', function ($f3, $params) {
    $user = Users::findById((int) $params['id']);
    if (!$user) {
        Api::error('User with ID ' . $params['id'] . ' not found', 404);
    }
    Api::json(Api::row($user));
});

$f3->route('PUT /users/@id', function ($f3, $params) {
    $auth = Auth::requireUser();
    $id = (int) $params['id'];
    $dbUser = Users::requireByFirebaseUid($auth['sub']);
    if ((int) $dbUser['id'] !== $id) {
        Api::error('Unauthorized', 403);
    }
    Api::json(Api::row(Users::update($id, Api::body())));
});

$f3->route('PUT /users', function () {
    $auth = Auth::requireUser();
    $dbUser = Users::requireByFirebaseUid($auth['sub']);
    Api::json(Api::row(Users::update((int) $dbUser['id'], Api::body())));
});

$f3->route('DELETE /users/@id', function ($f3, $params) {
    Auth::requireUser();
    $id = (int) $params['id'];
    $user = Users::findById($id);
    if (!$user) {
        Api::error("User with ID {$id} not found", 404);
    }
    Database::pdo()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    Api::json(['message' => 'User deleted successfully']);
});

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------
$f3->route('POST /books', function () {
    $auth = Auth::requireUser();
    $body = Api::body();
    if (empty($body['title']) || empty($body['genre'])) {
        Api::error('title and genre are required', 400);
    }
    Users::ensureExists($auth['sub'], $auth['email'] ?? null);

    $stmt = Database::pdo()->prepare(
        'INSERT INTO books (firebase_uid, title, genre, description, cover_image)
         VALUES (?, ?, ?, ?, ?)',
    );
    $stmt->execute([
        $auth['sub'],
        $body['title'],
        $body['genre'],
        $body['description'] ?? null,
        $body['cover_image'] ?? null,
    ]);
    $id = (int) Database::pdo()->lastInsertId();
    $book = Database::pdo()->prepare('SELECT * FROM books WHERE id = ?');
    $book->execute([$id]);
    Api::json(Api::row($book->fetch()));
});

$f3->route('GET /books', function ($f3) {
    $limit = Api::queryInt($f3, 'limit', 10);
    $offset = Api::queryInt($f3, 'offset', 0);
    $search = trim((string) ($f3->get('GET.search') ?? ''));
    $genre = trim((string) ($f3->get('GET.genre') ?? ''));

    $where = [];
    $params = [];
    if ($search !== '') {
        $where[] = 'LOWER(title) LIKE ?';
        $params[] = '%' . strtolower($search) . '%';
    }
    if ($genre !== '') {
        $where[] = 'LOWER(genre) LIKE ?';
        $params[] = '%' . strtolower($genre) . '%';
    }
    $sqlWhere = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $countStmt = Database::pdo()->prepare("SELECT COUNT(*) FROM books {$sqlWhere}");
    $countStmt->execute($params);
    $count = (int) $countStmt->fetchColumn();

    $sql = "SELECT * FROM books {$sqlWhere} ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $stmt = Database::pdo()->prepare($sql);
    $i = 1;
    foreach ($params as $p) {
        $stmt->bindValue($i++, $p);
    }
    $stmt->bindValue($i++, $limit, PDO::PARAM_INT);
    $stmt->bindValue($i, $offset, PDO::PARAM_INT);
    $stmt->execute();

    Api::json(['rows' => Api::rows($stmt->fetchAll()), 'count' => $count]);
});

$f3->route('GET /books/user/@firebaseUid', function ($f3, $params) {
    $limit = Api::queryInt($f3, 'limit', 10);
    $offset = Api::queryInt($f3, 'offset', 0);
    $uid = $params['firebaseUid'];

    $countStmt = Database::pdo()->prepare('SELECT COUNT(*) FROM books WHERE firebase_uid = ?');
    $countStmt->execute([$uid]);
    $count = (int) $countStmt->fetchColumn();

    $stmt = Database::pdo()->prepare(
        'SELECT * FROM books WHERE firebase_uid = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    );
    $stmt->bindValue(1, $uid);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();

    Api::json(['rows' => Api::rows($stmt->fetchAll()), 'count' => $count]);
});

$f3->route('GET /books/@id', function ($f3, $params) {
    $stmt = Database::pdo()->prepare('SELECT * FROM books WHERE id = ?');
    $stmt->execute([(int) $params['id']]);
    $book = $stmt->fetch();
    if (!$book) {
        Api::error('Book with ID ' . $params['id'] . ' not found', 404);
    }
    Api::json(Api::row($book));
});

$f3->route('PUT /books/@id', function ($f3, $params) {
    $auth = Auth::requireUser();
    $id = (int) $params['id'];
    $stmt = Database::pdo()->prepare('SELECT * FROM books WHERE id = ?');
    $stmt->execute([$id]);
    $book = $stmt->fetch();
    if (!$book) {
        Api::error("Book with ID {$id} not found", 404);
    }
    if ($book['firebase_uid'] !== $auth['sub']) {
        Api::error('Unauthorized', 403);
    }

    $body = Api::body();
    $fields = [];
    $values = [];
    foreach (['title', 'genre', 'description', 'cover_image', 'author'] as $col) {
        if (array_key_exists($col, $body)) {
            $fields[] = "{$col} = ?";
            $values[] = $body[$col];
        }
    }
    if ($fields) {
        $values[] = $id;
        Database::pdo()->prepare(
            'UPDATE books SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = ?',
        )->execute($values);
    }

    $stmt->execute([$id]);
    Api::json(Api::row($stmt->fetch()));
});

$f3->route('DELETE /books/@id', function ($f3, $params) {
    $auth = Auth::requireUser();
    $id = (int) $params['id'];
    $stmt = Database::pdo()->prepare('SELECT * FROM books WHERE id = ?');
    $stmt->execute([$id]);
    $book = $stmt->fetch();
    if (!$book) {
        Api::error("Book with ID {$id} not found", 404);
    }
    if ($book['firebase_uid'] !== $auth['sub']) {
        Api::error('Unauthorized', 403);
    }
    Database::pdo()->prepare('DELETE FROM books WHERE id = ?')->execute([$id]);
    Api::json(['message' => 'Book deleted successfully']);
});

// ---------------------------------------------------------------------------
// Book requests
// ---------------------------------------------------------------------------
function book_request_hydrate(array $row): array
{
    $out = Api::row($row);
    $requester = Users::findById((int) $row['requester_id']);
    $bookStmt = Database::pdo()->prepare('SELECT * FROM books WHERE id = ?');
    $bookStmt->execute([(int) $row['book_id']]);
    $book = $bookStmt->fetch() ?: null;
    $out['requester'] = Api::row($requester);
    $out['book'] = Api::row($book);
    return $out;
}

$f3->route('POST /book-requests', function () {
    $auth = Auth::requireUser();
    $body = Api::body();
    $bookId = (int) ($body['book_id'] ?? 0);
    if ($bookId < 1) {
        Api::error('book_id is required', 400);
    }

    $user = Users::findByFirebaseUid($auth['sub']);
    if (!$user) {
        Api::error('User not found', 400);
    }

    $check = Database::pdo()->prepare(
        'SELECT id FROM book_requests WHERE requester_id = ? AND book_id = ? LIMIT 1',
    );
    $check->execute([(int) $user['id'], $bookId]);
    if ($check->fetch()) {
        Api::error('You have already requested this book', 400);
    }

    Database::pdo()->prepare(
        'INSERT INTO book_requests (requester_id, book_id, status) VALUES (?, ?, ?)',
    )->execute([(int) $user['id'], $bookId, 'pending']);

    $id = (int) Database::pdo()->lastInsertId();
    $stmt = Database::pdo()->prepare('SELECT * FROM book_requests WHERE id = ?');
    $stmt->execute([$id]);
    Api::json(book_request_hydrate($stmt->fetch()));
});

$f3->route('GET /book-requests', function ($f3) {
    $limit = Api::queryInt($f3, 'limit', 20);
    $offset = Api::queryInt($f3, 'offset', 0);
    $count = (int) Database::pdo()->query('SELECT COUNT(*) FROM book_requests')->fetchColumn();
    $stmt = Database::pdo()->prepare(
        'SELECT * FROM book_requests ORDER BY created_at DESC LIMIT ? OFFSET ?',
    );
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = array_map('book_request_hydrate', $stmt->fetchAll());
    Api::json(['rows' => $rows, 'count' => $count]);
});

$f3->route('GET /book-requests/requester/@requester_id', function ($f3, $params) {
    $limit = Api::queryInt($f3, 'limit', 20);
    $offset = Api::queryInt($f3, 'offset', 0);
    $rid = (int) $params['requester_id'];

    $c = Database::pdo()->prepare('SELECT COUNT(*) FROM book_requests WHERE requester_id = ?');
    $c->execute([$rid]);
    $count = (int) $c->fetchColumn();

    $stmt = Database::pdo()->prepare(
        'SELECT * FROM book_requests WHERE requester_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    );
    $stmt->bindValue(1, $rid, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();
    Api::json(['rows' => array_map('book_request_hydrate', $stmt->fetchAll()), 'count' => $count]);
});

$f3->route('GET /book-requests/book/@book_id', function ($f3, $params) {
    $limit = Api::queryInt($f3, 'limit', 20);
    $offset = Api::queryInt($f3, 'offset', 0);
    $bid = (int) $params['book_id'];

    $c = Database::pdo()->prepare('SELECT COUNT(*) FROM book_requests WHERE book_id = ?');
    $c->execute([$bid]);
    $count = (int) $c->fetchColumn();

    $stmt = Database::pdo()->prepare(
        'SELECT * FROM book_requests WHERE book_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    );
    $stmt->bindValue(1, $bid, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();
    Api::json(['rows' => array_map('book_request_hydrate', $stmt->fetchAll()), 'count' => $count]);
});

$f3->route('GET /book-requests/@id', function ($f3, $params) {
    $stmt = Database::pdo()->prepare('SELECT * FROM book_requests WHERE id = ?');
    $stmt->execute([(int) $params['id']]);
    $row = $stmt->fetch();
    if (!$row) {
        Api::error('Book request with ID ' . $params['id'] . ' not found', 404);
    }
    Api::json(book_request_hydrate($row));
});

$f3->route('PUT /book-requests/@id', function ($f3, $params) {
    Auth::requireUser();
    $id = (int) $params['id'];
    $stmt = Database::pdo()->prepare('SELECT * FROM book_requests WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        Api::error("Book request with ID {$id} not found", 404);
    }
    $body = Api::body();
    if (isset($body['status'])) {
        Database::pdo()->prepare(
            'UPDATE book_requests SET status = ?, updated_at = NOW() WHERE id = ?',
        )->execute([$body['status'], $id]);
    }
    $stmt->execute([$id]);
    Api::json(book_request_hydrate($stmt->fetch()));
});

$f3->route('DELETE /book-requests/@id', function ($f3, $params) {
    Auth::requireUser();
    $id = (int) $params['id'];
    $stmt = Database::pdo()->prepare('SELECT id FROM book_requests WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        Api::error("Book request with ID {$id} not found", 404);
    }
    Database::pdo()->prepare('DELETE FROM book_requests WHERE id = ?')->execute([$id]);
    Api::json(['message' => 'Book request deleted successfully']);
});

// ---------------------------------------------------------------------------
// Chat threads
// ---------------------------------------------------------------------------
function chat_thread_hydrate(array $row, bool $withMessages = false): array
{
    $out = Api::row($row);

    $bookStmt = Database::pdo()->prepare('SELECT * FROM books WHERE id = ?');
    $bookStmt->execute([(int) $row['book_id']]);
    $out['book'] = Api::row($bookStmt->fetch() ?: null);

    $out['requester'] = Api::row(Users::findById((int) $row['requester_id']));
    $out['uploader'] = Api::row(Users::findById((int) $row['uploader_id']));

    if ($withMessages) {
        $m = Database::pdo()->prepare(
            'SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC',
        );
        $m->execute([(int) $row['id']]);
        $msgs = [];
        foreach ($m->fetchAll() as $msg) {
            $item = Api::row($msg);
            $item['sender'] = Api::row(Users::findById((int) $msg['sender_id']));
            $msgs[] = $item;
        }
        $out['messages'] = $msgs;
    }

    return $out;
}

$f3->route('POST /chat-threads', function () {
    $auth = Auth::requireUser();
    $body = Api::body();
    $bookId = (int) ($body['book_id'] ?? 0);
    $uploaderUid = (string) ($body['uploader_id'] ?? '');
    if ($bookId < 1 || $uploaderUid === '') {
        Api::error('book_id and uploader_id are required', 400);
    }

    $requester = Users::findByFirebaseUid($auth['sub']);
    $uploader = Users::findByFirebaseUid($uploaderUid);
    if (!$requester || !$uploader) {
        Api::error('User not found', 400);
    }

    $rid = (int) $requester['id'];
    $uid = (int) $uploader['id'];

    $find = Database::pdo()->prepare(
        'SELECT * FROM chat_threads
         WHERE book_id = ?
           AND (
             (requester_id = ? AND uploader_id = ?)
             OR (requester_id = ? AND uploader_id = ?)
           )
         LIMIT 1',
    );
    $find->execute([$bookId, $rid, $uid, $uid, $rid]);
    $existing = $find->fetch();
    if ($existing) {
        Api::json(chat_thread_hydrate($existing));
    }

    Database::pdo()->prepare(
        'INSERT INTO chat_threads (book_id, requester_id, uploader_id) VALUES (?, ?, ?)',
    )->execute([$bookId, $rid, $uid]);
    $id = (int) Database::pdo()->lastInsertId();
    $stmt = Database::pdo()->prepare('SELECT * FROM chat_threads WHERE id = ?');
    $stmt->execute([$id]);
    Api::json(chat_thread_hydrate($stmt->fetch()));
});

$f3->route('GET /chat-threads', function ($f3) {
    $limit = Api::queryInt($f3, 'limit', 20);
    $offset = Api::queryInt($f3, 'offset', 0);
    $count = (int) Database::pdo()->query('SELECT COUNT(*) FROM chat_threads')->fetchColumn();
    $stmt = Database::pdo()->prepare(
        'SELECT * FROM chat_threads ORDER BY updated_at DESC LIMIT ? OFFSET ?',
    );
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    Api::json([
        'rows' => array_map('chat_thread_hydrate', $stmt->fetchAll()),
        'count' => $count,
    ]);
});

$f3->route('GET /chat-threads/user/@user_id', function ($f3, $params) {
    $limit = Api::queryInt($f3, 'limit', 20);
    $offset = Api::queryInt($f3, 'offset', 0);
    $userId = (int) $params['user_id'];

    $c = Database::pdo()->prepare(
        'SELECT COUNT(*) FROM chat_threads WHERE requester_id = ? OR uploader_id = ?',
    );
    $c->execute([$userId, $userId]);
    $count = (int) $c->fetchColumn();

    $stmt = Database::pdo()->prepare(
        'SELECT * FROM chat_threads
         WHERE requester_id = ? OR uploader_id = ?
         ORDER BY updated_at DESC LIMIT ? OFFSET ?',
    );
    $stmt->bindValue(1, $userId, PDO::PARAM_INT);
    $stmt->bindValue(2, $userId, PDO::PARAM_INT);
    $stmt->bindValue(3, $limit, PDO::PARAM_INT);
    $stmt->bindValue(4, $offset, PDO::PARAM_INT);
    $stmt->execute();

    Api::json([
        'rows' => array_map('chat_thread_hydrate', $stmt->fetchAll()),
        'count' => $count,
    ]);
});

$f3->route('GET /chat-threads/book/@book_id', function ($f3, $params) {
    $stmt = Database::pdo()->prepare(
        'SELECT * FROM chat_threads WHERE book_id = ? ORDER BY created_at DESC',
    );
    $stmt->execute([(int) $params['book_id']]);
    Api::json(array_map('chat_thread_hydrate', $stmt->fetchAll()));
});

$f3->route('GET /chat-threads/@id', function ($f3, $params) {
    $stmt = Database::pdo()->prepare('SELECT * FROM chat_threads WHERE id = ?');
    $stmt->execute([(int) $params['id']]);
    $row = $stmt->fetch();
    if (!$row) {
        Api::error('Chat thread with ID ' . $params['id'] . ' not found', 404);
    }
    Api::json(chat_thread_hydrate($row, true));
});

$f3->route('DELETE /chat-threads/@id', function ($f3, $params) {
    $auth = Auth::requireUser();
    $id = (int) $params['id'];
    $stmt = Database::pdo()->prepare('SELECT * FROM chat_threads WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        Api::error("Chat thread with ID {$id} not found", 404);
    }

    $me = Users::findByFirebaseUid($auth['sub']);
    $myId = $me ? (int) $me['id'] : 0;
    if ($myId !== (int) $row['requester_id'] && $myId !== (int) $row['uploader_id']) {
        Api::error('Unauthorized', 403);
    }

    Database::pdo()->prepare('DELETE FROM chat_messages WHERE thread_id = ?')->execute([$id]);
    Database::pdo()->prepare('DELETE FROM chat_threads WHERE id = ?')->execute([$id]);
    Api::json(['message' => 'Chat thread deleted successfully']);
});

// ---------------------------------------------------------------------------
// Chat messages
// ---------------------------------------------------------------------------
$f3->route('POST /chat-messages', function () {
    $auth = Auth::requireUser();
    $body = Api::body();
    $threadId = (int) ($body['thread_id'] ?? 0);
    $message = trim((string) ($body['message'] ?? ''));
    if ($threadId < 1 || $message === '') {
        Api::error('thread_id and message are required', 400);
    }

    $sender = Users::findByFirebaseUid($auth['sub']);
    if (!$sender) {
        Api::error('User not found', 400);
    }

    Database::pdo()->prepare(
        'INSERT INTO chat_messages (thread_id, sender_id, message) VALUES (?, ?, ?)',
    )->execute([$threadId, (int) $sender['id'], $message]);

    Database::pdo()->prepare(
        'UPDATE chat_threads SET updated_at = NOW() WHERE id = ?',
    )->execute([$threadId]);

    $id = (int) Database::pdo()->lastInsertId();
    $stmt = Database::pdo()->prepare('SELECT * FROM chat_messages WHERE id = ?');
    $stmt->execute([$id]);
    $row = Api::row($stmt->fetch());
    $row['sender'] = Api::row($sender);
    Api::json($row);
});

$f3->route('GET /chat-messages/thread/@thread_id', function ($f3, $params) {
    $limit = Api::queryInt($f3, 'limit', 50);
    $offset = Api::queryInt($f3, 'offset', 0);
    $threadId = (int) $params['thread_id'];

    $c = Database::pdo()->prepare('SELECT COUNT(*) FROM chat_messages WHERE thread_id = ?');
    $c->execute([$threadId]);
    $count = (int) $c->fetchColumn();

    $stmt = Database::pdo()->prepare(
        'SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?',
    );
    $stmt->bindValue(1, $threadId, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = [];
    foreach ($stmt->fetchAll() as $msg) {
        $item = Api::row($msg);
        $item['sender'] = Api::row(Users::findById((int) $msg['sender_id']));
        $rows[] = $item;
    }

    Api::json(['rows' => $rows, 'count' => $count]);
});

$f3->route('GET /chat-messages/@id', function ($f3, $params) {
    $stmt = Database::pdo()->prepare('SELECT * FROM chat_messages WHERE id = ?');
    $stmt->execute([(int) $params['id']]);
    $msg = $stmt->fetch();
    if (!$msg) {
        Api::error('Chat message with ID ' . $params['id'] . ' not found', 404);
    }
    $item = Api::row($msg);
    $item['sender'] = Api::row(Users::findById((int) $msg['sender_id']));
    Api::json($item);
});

$f3->route('DELETE /chat-messages/@id', function ($f3, $params) {
    $auth = Auth::requireUser();
    $id = (int) $params['id'];
    $stmt = Database::pdo()->prepare('SELECT * FROM chat_messages WHERE id = ?');
    $stmt->execute([$id]);
    $msg = $stmt->fetch();
    if (!$msg) {
        Api::error("Chat message with ID {$id} not found", 404);
    }

    $me = Users::findByFirebaseUid($auth['sub']);
    if (!$me || (int) $me['id'] !== (int) $msg['sender_id']) {
        Api::error('Unauthorized', 403);
    }

    Database::pdo()->prepare('DELETE FROM chat_messages WHERE id = ?')->execute([$id]);
    Api::json(['message' => 'Chat message deleted successfully']);
});

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
$f3->route('POST /tags', function () {
    $body = Api::body();
    $name = trim((string) ($body['tag_name'] ?? ''));
    if ($name === '') {
        Api::error('tag_name is required', 400);
    }
    Database::pdo()->prepare('INSERT INTO tags (tag_name) VALUES (?)')->execute([$name]);
    $id = (int) Database::pdo()->lastInsertId();
    $stmt = Database::pdo()->prepare('SELECT * FROM tags WHERE id = ?');
    $stmt->execute([$id]);
    Api::json($stmt->fetch());
});

$f3->route('POST /tags/bulk', function () {
    $body = Api::body();
    $tags = $body['tags'] ?? [];
    if (!is_array($tags)) {
        Api::error('tags must be an array', 400);
    }
    $created = [];
    foreach ($tags as $tagName) {
        $trimmed = trim((string) $tagName);
        if ($trimmed === '') {
            continue;
        }
        Database::pdo()->prepare('INSERT INTO tags (tag_name) VALUES (?)')->execute([$trimmed]);
        $id = (int) Database::pdo()->lastInsertId();
        $stmt = Database::pdo()->prepare('SELECT * FROM tags WHERE id = ?');
        $stmt->execute([$id]);
        $created[] = $stmt->fetch();
    }
    Api::json(['created' => count($created), 'tags' => $created]);
});

$f3->route('GET /tags', function ($f3) {
    $limit = Api::queryInt($f3, 'limit', 100);
    $offset = Api::queryInt($f3, 'offset', 0);
    $count = (int) Database::pdo()->query('SELECT COUNT(*) FROM tags')->fetchColumn();
    $stmt = Database::pdo()->prepare('SELECT * FROM tags ORDER BY id ASC LIMIT ? OFFSET ?');
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    Api::json(['rows' => $stmt->fetchAll(), 'count' => $count]);
});

$f3->route('GET /tags/@id', function ($f3, $params) {
    $stmt = Database::pdo()->prepare('SELECT * FROM tags WHERE id = ?');
    $stmt->execute([(int) $params['id']]);
    $tag = $stmt->fetch();
    if (!$tag) {
        Api::error('Tag with ID ' . $params['id'] . ' not found', 404);
    }
    Api::json($tag);
});

$f3->route('PUT /tags/@id', function ($f3, $params) {
    $id = (int) $params['id'];
    $stmt = Database::pdo()->prepare('SELECT * FROM tags WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        Api::error("Tag with ID {$id} not found", 404);
    }
    $body = Api::body();
    if (isset($body['tag_name'])) {
        Database::pdo()->prepare('UPDATE tags SET tag_name = ? WHERE id = ?')
            ->execute([$body['tag_name'], $id]);
    }
    $stmt->execute([$id]);
    Api::json($stmt->fetch());
});

$f3->route('DELETE /tags/@id', function ($f3, $params) {
    $id = (int) $params['id'];
    $stmt = Database::pdo()->prepare('SELECT id FROM tags WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        Api::error("Tag with ID {$id} not found", 404);
    }
    Database::pdo()->prepare('DELETE FROM tags WHERE id = ?')->execute([$id]);
    Api::json(['message' => 'Tag deleted successfully']);
});
