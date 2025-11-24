# PowerShell test script for the generate-cv edge function
# Usage: .\test.ps1 [jwt_token]

param(
    [string]$JwtToken = "your_jwt_token_here"
)

# Configuration
$FunctionUrl = if ($env:SUPABASE_URL) { "$env:SUPABASE_URL/functions/v1/generate-cv" } else { "http://127.0.0.1:54321/functions/v1/generate-cv" }

Write-Host "Testing CV Generation Function" -ForegroundColor Yellow
Write-Host "URL: $FunctionUrl`n"

# Test payload
$Payload = @{
    additionalInstructions = @"
I have 5 years of experience as a Senior Full Stack Developer at TechCorp. 
I led a team of 5 developers and successfully delivered 10+ projects. 
I have a Masters degree in Computer Science from University of Paris. 
My technical skills include JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, and AWS. 
I am certified in AWS Solutions Architect.
"@
} | ConvertTo-Json

Write-Host "Sending request...`n" -ForegroundColor Yellow

# Make the request
try {
    $Response = Invoke-RestMethod -Uri $FunctionUrl `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $JwtToken"
            "Content-Type" = "application/json"
        } `
        -Body $Payload `
        -ErrorAction Stop

    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host "`nGenerated CV:" -ForegroundColor Yellow
    Write-Host $Response.cv -ForegroundColor White
    Write-Host "`nUser Email: $($Response.userEmail)" -ForegroundColor Cyan
    Write-Host "Timestamp: $($Response.timestamp)" -ForegroundColor Cyan

} catch {
    Write-Host "✗ Failed!" -ForegroundColor Red
    Write-Host "`nError Details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nError Response:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""

