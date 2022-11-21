docker run --name local-mysql \
    -e MYSQL_ROOT_PASSWORD=my-secret-pw \
    -e MYSQL_DATABASE=test \
    -e MYSQL_USER=prisma \
    -e MYSQL_PASSWORD=passwd \
    -p 3306:3306  -d mysql:latest