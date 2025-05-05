pipeline {
    agent any
    tools {
        nodejs 'NodeJS' // Ensure 'NodeJS' is configured with version 20.x
    }

    environment {
        NEXUS_URL = 'http://192.168.33.10:8081'
        NEXUS_REPO = 'maven-releases'
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

        // Stage 2: Install Required Tools
        stage('Install Tools') {
            steps {
                script {
                    sh '''
                        # Install zip if not available
                        if ! command -v zip >/dev/null 2>&1; then
                            echo "Installing zip package..."
                            sudo apt-get update -qq && sudo apt-get install -y zip
                        fi
                    '''
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

        // Stage 5: Quality Gate Check
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
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-credentials',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASS'
                    )]) {
                        // Frontend (React)
                        sh """
                            if [ -d "frontendReact/dist" ]; then
                                zip -r frontend-${BUILD_VERSION}.zip frontendReact/dist/ || echo "Warning: Frontend zip failed"
                                curl -f -u $NEXUS_USER:$NEXUS_PASS \
                                    --upload-file frontend-${BUILD_VERSION}.zip \
                                    "$NEXUS_URL/repository/$NEXUS_REPO/frontend/${BUILD_VERSION}/" || echo "Warning: Frontend upload failed"
                            else
                                echo "Warning: frontendReact/dist directory not found"
                            fi
                        """

                        // Backend
                        sh """
                            if [ -d "Backend/target" ] && [ -n "$(ls -A Backend/target/*.jar 2>/dev/null)" ]; then
                                curl -f -u $NEXUS_USER:$NEXUS_PASS \
                                    --upload-file Backend/target/*.jar \
                                    "$NEXUS_URL/repository/$NEXUS_REPO/backend/${BUILD_VERSION}/" || echo "Warning: Backend upload failed"
                            else
                                echo "Warning: No JAR files found in Backend/target"
                            fi
                        """
                    }
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
            // Uncomment if you have Slack Notification plugin installed
            // slackSend color: 'danger', message: "Build ${env.BUILD_NUMBER} failed!"
        }
    }
}