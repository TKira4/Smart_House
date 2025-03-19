CREATE TABLE User (
    userID INT NOT NULL AUTO_INCREMENT,
    fName VARCHAR(50) NOT NULL,
    lName VARCHAR(50) NOT NULL,
    userName VARCHAR(50) NOT NULL,
    contactInfo VARCHAR(100),
    phoneNumber VARCHAR(20),
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    activeHomeID INT,  -- khóa ngoại đến Home.homeID (sẽ thiết lập sau)
    PRIMARY KEY (userID),
    UNIQUE KEY (userName),
    UNIQUE KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE Home (
    homeID INT NOT NULL AUTO_INCREMENT,
    address VARCHAR(255) NOT NULL,
    ownerID INT NOT NULL,   -- khóa ngoại đến User.userID
    PRIMARY KEY (homeID),
    FOREIGN KEY (ownerID) REFERENCES User(userID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- liên kết khóa ngoại cho activeHomeID
ALTER TABLE User
ADD CONSTRAINT fk_activeHome
FOREIGN KEY (activeHomeID) REFERENCES Home(homeID);


CREATE TABLE Room (
    roomID INT NOT NULL AUTO_INCREMENT,
    nameRoom VARCHAR(100) NOT NULL,
    homeID INT NOT NULL,   -- khóa ngoại đến Home.homeID
    PRIMARY KEY (roomID),
    FOREIGN KEY (homeID) REFERENCES Home(homeID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE Device (
    deviceID INT NOT NULL AUTO_INCREMENT,
    deviceName VARCHAR(100) NOT NULL,
    state VARCHAR(20) NOT NULL,   -- ví dụ: 'ON', 'OFF'
    value DECIMAL(10,2),          -- nếu cần lưu giá trị đo được
    type VARCHAR(50) NOT NULL,
    roomID INT NOT NULL,          -- khóa ngoại đến Room.roomID
    feedName VARCHAR(20) NOT NULL,
    PRIMARY KEY (deviceID),
    FOREIGN KEY (roomID) REFERENCES Room(roomID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE AlertLog (
    alertID INT NOT NULL AUTO_INCREMENT,
    deviceID INT NOT NULL,           -- khóa ngoại đến Device.deviceID
    alertType VARCHAR(50) NOT NULL,  -- ví dụ: 'Temperature', 'Smoke'
    alertValue VARCHAR(50),          -- ví dụ: '55°C', '300 ppm'
    alertStatus VARCHAR(20) NOT NULL, -- ví dụ: 'Pending', 'Resolved'
    timestamp DATETIME NOT NULL,
    PRIMARY KEY (alertID),
    FOREIGN KEY (deviceID) REFERENCES Device(deviceID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ActionLog (
    actionID INT NOT NULL AUTO_INCREMENT,
    userID INT NOT NULL,             -- khóa ngoại đến User.userID
    deviceID INT NOT NULL,           -- khóa ngoại đến Device.deviceID
    actionType VARCHAR(50) NOT NULL, -- ví dụ: 'Adjust Alert Level', 'Reset'
    timestamp DATETIME NOT NULL,
    PRIMARY KEY (actionID),
    FOREIGN KEY (userID) REFERENCES User(userID),
    FOREIGN KEY (deviceID) REFERENCES Device(deviceID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
