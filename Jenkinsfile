pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }

    environment {
        NEXUS_URL = 'http://192.168.33.10:8081'
        NEXUS_REPO = 'maven-releases'
        BUILD_VERSION = "${env.BUILD_ID}-${new Date().format('yyyyMMddHHmm')}"
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    try {
                        git branch: 'main', 
                            credentialsId: 'github-token', 
                            url: 'https://github.com/Saif-Hlaimi/DevMinds_4TWIN5_pidev.git'
                    } catch (Exception e) {
                        error "Checkout failed: ${e.message}"
                    }
                }
            }
        }

        stage('Verify Environment') {
            steps {
                script {
                    // Verify required commands
                    def commands = ['tar', 'curl', 'npm', 'node']
                    commands.each { cmd ->
                        try {
                            sh "command -v ${cmd}"
                            echo "${cmd} command is available"
                        } catch (Exception e) {
                            error "Required command '${cmd}' not found"
                        }
                    }

                    // Verify Nexus connectivity
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-credentials',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASS'
                    )]) {
                        try {
                            def status = sh(
                                script: "curl -s -o /dev/null -w '%{http_code}' -u ${env.NEXUS_USER}:${env.NEXUS_PASS} ${env.NEXUS_URL}/service/rest/v1/status",
                                returnStdout: true
                            ).trim()
                            
                            if (status != "200") {
                                error "Nexus connection failed (HTTP ${status}). Verify: \n1. Nexus URL is correct\n2. Credentials are valid\n3. User has proper permissions"
                            }
                            echo "Successfully connected to Nexus"
                        } catch (Exception e) {
                            error "Nexus verification failed: ${e.message}"
                        }
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontendReact') {
                    try {
                        sh 'npm install'
                        sh 'npm run build'
                        if (!fileExists('dist/index.html')) {
                            error "Frontend build failed - missing dist/index.html"
                        }
                    } catch (Exception e) {
                        error "Frontend build failed: ${e.message}"
                    }
                }
            }
        }

        stage('Package Backend') {
            steps {
                dir('Backend') {
                    script {
                        try {
                            if (!fileExists('package.json')) {
                                error "package.json not found"
                            }
                            
                            def packageJson = readJSON file: 'package.json'
                            if (!packageJson.name || !packageJson.version) {
                                error "package.json missing name/version"
                            }
                            
                            sh 'npm install'
                            sh 'npm pack'
                            
                            if (!fileExists("${packageJson.name}-${packageJson.version}.tgz")) {
                                error "npm pack failed to create .tgz file"
                            }
                        } catch (Exception e) {
                            error "Backend packaging failed: ${e.message}"
                        }
                    }
                }
            }
        }

        stage('Publish to Nexus') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-credentials',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASS'
                    )]) {
                        try {
                            // Upload Frontend
                            dir('frontendReact') {
                                sh """
                                    tar -czvf ../frontend-${env.BUILD_VERSION}.tar.gz -C dist .
                                    curl -f -v -u ${env.NEXUS_USER}:${env.NEXUS_PASS} \\
                                        --upload-file ../frontend-${env.BUILD_VERSION}.tar.gz \\
                                        "${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/frontend/${env.BUILD_VERSION}/"
                                """
                            }

                            // Upload Backend
                            dir('Backend') {
                                def packageJson = readJSON file: 'package.json'
                                def tgzFile = "${packageJson.name}-${packageJson.version}.tgz"
                                
                                sh """
                                    curl -f -v -u ${env.NEXUS_USER}:${env.NEXUS_PASS} \\
                                        --upload-file ${tgzFile} \\
                                        "${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/backend/${env.BUILD_VERSION}/"
                                """
                            }
                        } catch (Exception e) {
                            error "Failed to publish to Nexus: ${e.message}"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/dist/**,**/*.tgz,**/*.tar.gz', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo "Artifacts published successfully to:"
            echo "Frontend: ${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/frontend/${env.BUILD_VERSION}/"
            echo "Backend: ${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/backend/${env.BUILD_VERSION}/"
        }
        failure {
            echo "Pipeline failed - check logs for details"
            script {
                echo "Nexus troubleshooting:"
                echo "1. Verify credentials in Jenkins credential store (nexus-credentials)"
                echo "2. Check Nexus URL: ${env.NEXUS_URL}"
                echo "3. Ensure user has deploy permissions to ${env.NEXUS_REPO}"
                sh "curl -I ${env.NEXUS_URL} || true"
            }
        }
    }
}