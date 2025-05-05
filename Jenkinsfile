pipeline {
    agent any
    tools {
        nodejs 'NodeJS' // Ensure 'NodeJS' is configured with version 20.x
    }

    environment {
        NEXUS_URL = 'http://192.168.33.10:8081' // Update with your Nexus URL
        NEXUS_REPO = 'maven-releases'              // e.g., 'maven-releases'
        NEXUS_CREDS = credentials('nexus-credentials') // Jenkins credential ID
        BUILD_VERSION = "${env.BUILD_ID}-${new Date().format('yyyyMMddHHmm')}"
    }

    stages {
        // Stage 1: Checkout Code
        stage('Checkout') {
            steps {
                git branch: 'main', 
                    credentialsId: 'github-token', 
                    url: 'https://github.com/Saif-Hlaimi/DevMinds_4TWIN5_pidev.git'
            }
        }

        // Stage 2: Build
        stage('Build') {
            steps {
                script {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        // Stage 3: Verify GitHub Actions Results
        stage('Check GitHub Actions') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        def response = sh(script: """
                            curl -s -H "Authorization: token \${GITHUB_TOKEN}" \
                                -H "Accept: application/vnd.github.v3+json" \
                                https://api.github.com/repos/Saif-Hlaimi/DevMinds_4TWIN5_pidev/actions/workflows/ci.yml/runs?per_page=1
                        """, returnStdout: true).trim()

                        def json = readJSON text: response
                        def run = json.workflow_runs[0] ?: error('No GitHub Actions runs found')

                        echo """
                        GitHub Actions Run:
                        - ID: ${run.id}
                        - Status: ${run.status}
                        - Conclusion: ${run.conclusion}
                        - URL: ${run.html_url}
                        """

                        // Check job results
                        def jobs = sh(script: """
                            curl -s -H "Authorization: token \${GITHUB_TOKEN}" \
                                -H "Accept: application/vnd.github.v3+json" \
                                https://api.github.com/repos/Saif-Hlaimi/DevMinds_4TWIN5_pidev/actions/runs/${run.id}/jobs
                        """, returnStdout: true).trim()

                        def frontendJob = readJSON(text: jobs).jobs.find { it.name == 'frontend' }
                        def backendJob = readJSON(text: jobs).jobs.find { it.name == 'backend' }

                        if (frontendJob?.conclusion != 'success' || backendJob?.conclusion != 'success') {
                            error "Tests failed: Frontend=${frontendJob?.conclusion}, Backend=${backendJob?.conclusion}"
                        }
                    }
                }
            }
        }

        // Stage 4: SonarQube Analysis
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('sq1') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=DevMinds_4TWIN5_pidev \
                            -Dsonar.projectName=DevMinds_4TWIN5_pidev \
                            -Dsonar.sources=Backend/Controllers \
                            -Dsonar.tests=Backend/tests,Backend/test \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                        """
                    }
                }
            }
        }

        // Stage 5: Quality Gate
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // Stage 6: Publish to Nexus
        stage('Publish to Nexus') {
            steps {
                script {
                    // Frontend (React)
                    sh """
                        zip -r frontend-${BUILD_VERSION}.zip frontendReact/dist/
                        curl -u $NEXUS_CREDS_USR:$NEXUS_CREDS_PSW \
                            --upload-file frontend-${BUILD_VERSION}.zip \
                            "$NEXUS_URL/repository/$NEXUS_REPO/frontend/${BUILD_VERSION}/"
                    """

                    // Backend
                    sh """
                        curl -u $NEXUS_CREDS_USR:$NEXUS_CREDS_PSW \
                            --upload-file Backend/target/*.jar \
                            "$NEXUS_URL/repository/$NEXUS_REPO/backend/${BUILD_VERSION}/"
                    """
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/dist/**,**/target/*.jar', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo "Pipeline succeeded! Artifacts published to Nexus:"
            echo "Frontend: $NEXUS_URL/repository/$NEXUS_REPO/frontend/$BUILD_VERSION/"
            echo "Backend: $NEXUS_URL/repository/$NEXUS_REPO/backend/$BUILD_VERSION/"
        }
        failure {
            echo 'Pipeline failed! Check logs for details.'
            slackSend color: 'danger', message: "Build ${env.BUILD_NUMBER} failed!"
        }
    }
}