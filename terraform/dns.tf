# DNS and SSL configuration for admin.auctionspulse.com
# Requires: Route53 hosted zone for auctionspulse.com already exists in the account

# Look up the existing hosted zone
data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.hosted_zone_name
}

# ACM Certificate for the custom domain
resource "aws_acm_certificate" "crm_app" {
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Name = "${var.project_name}-crm-app-cert-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation records for ACM certificate
resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.crm_app[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main[0].zone_id
}

# Wait for certificate validation
resource "aws_acm_certificate_validation" "crm_app" {
  count                   = var.domain_name != "" ? 1 : 0
  certificate_arn         = aws_acm_certificate.crm_app[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# CNAME record pointing subdomain to CloudFront
resource "aws_route53_record" "crm_app" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.crm_app.domain_name
    zone_id                = aws_cloudfront_distribution.crm_app.hosted_zone_id
    evaluate_target_health = false
  }
}

output "custom_domain_url" {
  description = "Custom domain URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : null
}
