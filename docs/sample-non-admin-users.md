# Sample non-admin users

Use these as test accounts in Firebase Authentication and Firestore.

## Auth accounts to create

### 1. Emma Frosting

- Email: emma.frosting@example.com
- Password: Santa2026!

### 2. Leo Lantern

- Email: leo.lantern@example.com
- Password: Santa2026!

### 3. Nina Snow

- Email: nina.snow@example.com
- Password: Santa2026!

## Firestore documents

Create one document in the **users** collection and one document in the **userPrivate** collection for each auth user. The document ID must match that user's Firebase Auth UID.

### users collection

#### Emma document

- Document ID: Emma's Auth UID
- name: Emma Frosting
- discordName: emma_cookies
- receiver: null
- presents:
  - headline: Cozy Blanket
    description: Soft and warm for winter nights
    link: Blanket idea
    url: https://example.com/blanket
    image: null
  - headline: Hot Chocolate Set
    description: Fancy mugs and cocoa mix
    link: Cocoa set
    url: https://example.com/cocoa
    image: null
- role: user

#### Leo document

- Document ID: Leo's Auth UID
- name: Leo Lantern
- discordName: leo_gifts
- receiver: null
- presents:
  - headline: Desk Lamp
    description: Warm light for late-night gaming
    link: Lamp link
    url: https://example.com/lamp
    image: null
- role: user

#### Nina document

- Document ID: Nina's Auth UID
- name: Nina Snow
- discordName: ninaflakes
- receiver: null
- presents:
  - headline: Tea Sampler
    description: Mixed herbal and black teas
    link: Tea box
    url: https://example.com/tea
    image: null
- role: user

### userPrivate collection

#### Emma document

- Document ID: Emma's Auth UID
- email: emma.frosting@example.com
- address: 12 Candy Cane Lane
- receiverAddress: null

#### Leo document

- Document ID: Leo's Auth UID
- email: leo.lantern@example.com
- address: 88 Winter Oak Road
- receiverAddress: null

#### Nina document

- Document ID: Nina's Auth UID
- email: nina.snow@example.com
- address: 5 Snowdrop Court
- receiverAddress: null

## Quickest way to add them

1. Open Firebase Console.
2. Go to Authentication, then add the three users with the emails and password above.
3. Copy each generated UID.
4. Go to Firestore Database.
5. In **users**, create a document using that UID and fill in the public fields.
6. In **userPrivate**, create a document using the same UID and fill in the private fields.
7. Make sure each user has **role: user** so they are non-admin.
