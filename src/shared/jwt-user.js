class JwtUser {
    constructor(httpEvent) {
        if (!httpEvent || !httpEvent.headers || !httpEvent.headers['Authorization']) {
            throw Error('Authorization header missing');
        }
        
        let authHeader = httpEvent.headers['Authorization'];
        
        if (!authHeader.startsWith('Bearer')) {
            throw Error('Bearer token is missing');
        }
        
        let splitResult = authHeader.trim().split(' ');
        if (splitResult.length != 2) {
            throw Error('Missing Jwt token');
        }
        
        this.jwt = splitResult[1];
        
        this.jwt = authHeader;
        this.parseJwt();
    }
    
    parseJwt() {
        let userData = this.jwt.split('.')[1];
        let buffer = Buffer.from(userData, 'base64');
        let json = buffer.toString('utf8');
        let user = JSON.parse(json);
        
        this.userId = user.sub;
        this.username = user.username;
    }
}

module.exports = JwtUser;