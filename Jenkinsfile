pipeline {
    agent any

    tools {
        nodejs "NodeJS" // Make sure this matches the NodeJS installation name in Jenkins
    }

    environment {
        SERVER_DIR = 'server'   // Your backend folder
        CLIENT_DIR = 'client'   // Your frontend folder
        BACKEND_ENTRY = 'server.js' // Your backend entry file
    }

    stages {

        stage('Checkout') {
            steps {
                git url: 'https://github.com/guru-vishal/cine-mate.git', branch: 'master'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir("${SERVER_DIR}") {
                    bat 'npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir("${CLIENT_DIR}") {
                    bat 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir("${CLIENT_DIR}") {
                    bat 'npm run build'
                }
            }
        }

        stage('Restart Backend') {
            steps {
                dir("${SERVER_DIR}") {
                    // Restart backend using PM2; start if not running
                    bat "pm2 restart ${BACKEND_ENTRY} || pm2 start ${BACKEND_ENTRY}"
                }
            }
        }

        // Optional Terraform Stage (Enable if you want to provision infra automatically)
        /*
        stage('Terraform Apply') {
            steps {
                dir('infrastructure') { // Folder with your Terraform scripts
                    bat 'terraform init'
                    bat 'terraform plan'
                    bat 'terraform apply -auto-approve'
                }
            }
        }
        */
    }

    post {
        success {
            echo "Build and Deployment Successful!"
        }
        failure {
            echo "Build Failed. Check logs."
        }
    }
}
