pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', credentialsId: 'github-token', url: 'https://github.com/Saif-Hlaimi/DevMinds_4TWIN5_pidev.git'
            }
        }
    }
}