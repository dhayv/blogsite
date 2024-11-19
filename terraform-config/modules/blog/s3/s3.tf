
resource "aws_s3_bucket_website_configuration" "s3_bucket" {
  bucket = aws_s3_bucket.s3_bucket.id
}


resource "aws_s3_bucket_acl" "s3_bucket" {
  bucket = aws_s3_bucket.s3_bucket.id

  acl = "private"
}

locals {
    s3_origin_id = "myS3Origin"
}

resource "aws_s3_object" "build" {
  for_each = fileset("../my-app/app/", "**")
  bucket = aws_s3_bucket.s3_bucket.id
  key = each.value
  source = "../my-app/app/${each.value}"
  etag = filemd5("../my-app/app/${each.value}")
  acl    = "private"
content_type = lookup(local.mime_types, regex("\\.[^.]+$", each.key), null)
}

